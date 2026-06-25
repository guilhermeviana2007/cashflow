"use client";

import { useEffect, useRef, useState } from "react";
import { extrairNotaDaImagem } from "./actions";
import { criarLancamento } from "@/app/lancamentos/actions";
import type { NotaExtraida } from "@/lib/anthropic";

type Categoria = { id: string; nome: string };

export function ImportadorNota({ categorias }: { categorias: Categoria[] }) {
  const [fase, setFase] = useState<"upload" | "extraindo" | "confirmar">("upload");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<NotaExtraida | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [cameraAberta, setCameraAberta] = useState(false);
  const [cameraErro, setCameraErro] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Liga o stream da câmera ao <video> quando ela abre.
  useEffect(() => {
    if (cameraAberta && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraAberta]);

  // Garante que a câmera é desligada ao sair da tela.
  useEffect(() => {
    return () => pararStream();
  }, []);

  function pararStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function definirArquivo(f: File) {
    if (preview) URL.revokeObjectURL(preview);
    setArquivo(f);
    setPreview(URL.createObjectURL(f));
    setErro(null);
  }

  function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) definirArquivo(f);
  }

  async function abrirCamera() {
    setCameraErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraAberta(true);
    } catch {
      setCameraErro(
        "Não consegui acessar a câmera. Permita o acesso no navegador ou use o envio de arquivo."
      );
    }
  }

  function fecharCamera() {
    pararStream();
    setCameraAberta(false);
  }

  function capturar() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) definirArquivo(new File([blob], "nota.jpg", { type: "image/jpeg" }));
        fecharCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  async function lerNota() {
    if (!arquivo) return;
    setErro(null);
    setFase("extraindo");
    const fd = new FormData();
    fd.append("imagem", arquivo);
    const resultado = await extrairNotaDaImagem(fd);
    if (resultado.ok) {
      setDados(resultado.dados);
      setFase("confirmar");
    } else {
      setErro(resultado.mensagem);
      setFase("upload");
    }
  }

  const catSugeridaId =
    dados && categorias.find((c) => c.nome === dados.categoriaSugerida)?.id;
  const valorInicial = dados ? dados.valorTotalReais.toFixed(2).replace(".", ",") : "";

  return (
    <div className="max-w-lg">
      {/* Etapa 1: captura / upload */}
      {fase !== "confirmar" && (
        <div className="space-y-4">
          {cameraAberta ? (
            <div className="space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg border border-border bg-black"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharCamera}
                  className="rounded-lg border border-border px-4 py-3 font-medium text-muted hover:bg-card"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={capturar}
                  className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90"
                >
                  📸 Capturar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={abrirCamera}
                  className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-4 font-semibold text-primary hover:bg-primary/15"
                >
                  📷 Tirar foto da nota
                </button>

                <label className="block">
                  <span className="mb-2 block text-center text-xs text-muted">
                    ou envie um arquivo
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    capture="environment"
                    onChange={aoEscolherArquivo}
                    className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-card file:px-4 file:py-2 file:text-foreground file:font-medium"
                  />
                </label>
              </div>

              {cameraErro && (
                <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                  {cameraErro}
                </div>
              )}

              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Pré-visualização da nota"
                  className="max-h-72 rounded-lg border border-border"
                />
              )}

              {erro && (
                <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                  {erro}
                </div>
              )}

              <button
                type="button"
                onClick={lerNota}
                disabled={!arquivo || fase === "extraindo"}
                className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                {fase === "extraindo" ? "🤖 Lendo a nota com IA..." : "Ler nota com IA"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Etapa 2: confirmação */}
      {fase === "confirmar" && dados && (
        <form
          action={async (fd) => {
            setSalvando(true);
            await criarLancamento(fd);
          }}
          className="space-y-4"
        >
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
            🤖 Li a nota. <strong>Confira os dados</strong> antes de salvar — a IA pode
            errar.
          </div>

          <input type="hidden" name="tipo" value="SAIDA" />

          <Campo label="Descrição">
            <input
              name="descricao"
              required
              defaultValue={dados.fornecedor || "Compra"}
              className="inp"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Valor total (R$)">
              <input name="valor" required defaultValue={valorInicial} className="inp" />
            </Campo>
            <Campo label="Data">
              <input
                name="data"
                type="date"
                defaultValue={dados.dataEmissao || new Date().toISOString().slice(0, 10)}
                className="inp"
              />
            </Campo>
          </div>

          <Campo label="Categoria">
            <select name="categoriaId" defaultValue={catSugeridaId ?? ""} className="inp">
              <option value="">— Sem categoria —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Fornecedor">
            <input name="fornecedor" defaultValue={dados.fornecedor} className="inp" />
          </Campo>

          {dados.itens.length > 0 && (
            <details className="rounded-lg border border-border bg-card p-3 text-sm">
              <summary className="cursor-pointer text-muted">
                {dados.itens.length} item(ns) lido(s) na nota
              </summary>
              <ul className="mt-2 space-y-1">
                {dados.itens.map((it, i) => (
                  <li key={i} className="flex justify-between text-muted">
                    <span>{it.descricao}</span>
                    <span>R$ {it.valorReais.toFixed(2).replace(".", ",")}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFase("upload");
                setDados(null);
              }}
              className="rounded-lg border border-border px-4 py-3 font-medium text-muted hover:bg-card"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Confirmar e salvar saída"}
            </button>
          </div>
        </form>
      )}

      <style>{`
        .inp {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--foreground);
          border-radius: 0.5rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.95rem;
          outline: none;
        }
        .inp:focus { border-color: var(--primary); }
      `}</style>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
