"use client";

import { useLayoutEffect, useRef, useState } from "react";

const SAIDA = 256; // tamanho final da foto, em px (quadrado)
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

type Pos = { x: number; y: number };

/**
 * Modal para o usuário enquadrar a foto de perfil: arrastar para posicionar,
 * pinçar (ou usar o controle) para aproximar. Gera um JPEG quadrado de 256px
 * recortado exatamente como ficou na pré-visualização circular.
 */
export function CropperFoto({
  src,
  onConfirmar,
  onCancelar,
}: {
  src: string; // data URL da imagem original escolhida
  onConfirmar: (dataUrl: string) => void;
  onCancelar: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [vSize, setVSize] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });

  // escala base = "cover": faz a imagem cobrir o viewport com zoom 1
  const baseScale = nat && vSize ? Math.max(vSize / nat.w, vSize / nat.h) : 1;

  // carrega as dimensões reais da imagem
  useLayoutEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = src;
  }, [src]);

  // mede o viewport (e re-mede se a tela mudar de tamanho)
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const medir = () => setVSize(el.getBoundingClientRect().width);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // centraliza a imagem assim que imagem + viewport estiverem prontos (uma vez)
  const centralizadoRef = useRef(false);
  useLayoutEffect(() => {
    if (!nat || !vSize || centralizadoRef.current) return;
    const eff = Math.max(vSize / nat.w, vSize / nat.h);
    setPos({ x: (vSize - nat.w * eff) / 2, y: (vSize - nat.h * eff) / 2 });
    centralizadoRef.current = true;
  }, [nat, vSize]);

  // mantém a imagem sempre cobrindo o círculo (sem deixar "buracos")
  function clamp(p: Pos, eff: number): Pos {
    if (!nat) return p;
    const w = nat.w * eff;
    const h = nat.h * eff;
    return {
      x: Math.min(0, Math.max(vSize - w, p.x)),
      y: Math.min(0, Math.max(vSize - h, p.y)),
    };
  }

  // aplica zoom ancorando num ponto (ax, ay) do viewport — pinça ou slider
  function aplicarZoom(novo: number, ax: number, ay: number) {
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, novo));
    const effAntes = baseScale * zoom;
    const effDepois = baseScale * z;
    setPos((p) =>
      clamp(
        {
          x: ax - (ax - p.x) * (effDepois / effAntes),
          y: ay - (ay - p.y) * (effDepois / effAntes),
        },
        effDepois
      )
    );
    setZoom(z);
  }

  // --- gestos (arrastar com 1 dedo, pinçar com 2) ---
  const pointers = useRef<Map<number, Pos>>(new Map());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    const anterior = pointers.current.get(e.pointerId)!;
    const atual = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, atual);

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = viewportRef.current!.getBoundingClientRect();
      const meioX = (a.x + b.x) / 2 - rect.left;
      const meioY = (a.y + b.y) / 2 - rect.top;
      aplicarZoom(pinch.current.zoom * (dist / pinch.current.dist), meioX, meioY);
    } else if (pointers.current.size === 1) {
      const dx = atual.x - anterior.x;
      const dy = atual.y - anterior.y;
      const eff = baseScale * zoom;
      setPos((p) => clamp({ x: p.x + dx, y: p.y + dy }, eff));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }

  // recorta o quadrado visível no viewport e gera o JPEG final
  function confirmar() {
    const img = imgRef.current;
    if (!img || !vSize) return;
    const eff = baseScale * zoom;
    const canvas = document.createElement("canvas");
    canvas.width = SAIDA;
    canvas.height = SAIDA;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sSize = vSize / eff; // lado, em px da imagem original, que cabe no viewport
    ctx.drawImage(img, -pos.x / eff, -pos.y / eff, sSize, sSize, 0, 0, SAIDA, SAIDA);
    onConfirmar(canvas.toDataURL("image/jpeg", 0.85));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-1">Ajustar foto</h3>
        <p className="text-sm text-muted mb-4">
          Arraste para posicionar e use o controle abaixo para aproximar.
        </p>

        <div className="flex justify-center">
          <div
            ref={viewportRef}
            className="relative aspect-square w-[min(72vw,260px)] cursor-grab touch-none select-none overflow-hidden rounded-full border border-border bg-background active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {nat && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none"
                style={{
                  width: nat.w * baseScale * zoom,
                  height: nat.h * baseScale * zoom,
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
          </div>
        </div>

        {/* Controle de zoom (alternativa à pinça, para desktop) */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-muted">−</span>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={(e) =>
              aplicarZoom(parseFloat(e.target.value), vSize / 2, vSize / 2)
            }
            className="h-1 flex-1 cursor-pointer accent-[var(--color-primary)]"
            aria-label="Aproximar foto"
          />
          <span className="text-sm text-muted">+</span>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}
