"use client";

import { useRef, useState } from "react";
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
  const enviandoRef = useRef(false);

  function definirArquivo(f: File) {
    if (preview) URL.revokeObjectURL(preview);
    setArquivo(f);
    setPreview(URL.createObjectURL(f));
    setErro(null);
  }

  // Lê a nota imediatamente após a foto ser tirada/escolhida — uma única ação,
  // sem segurar câmera ao vivo na memória (evita o recarregamento no celular).
  async function lerNota(f: File) {
    setErro(null);
    setFase("extraindo");
    const fd = new FormData();
    fd.append("imagem", f);
    const resultado = await extrairNotaDaImagem(fd);
    if (resultado.ok) {
      setDados(resultado.dados);
      setFase("confirmar");
    } else {
      setErro(resultado.mensagem);
      setFase("upload");
    }
  }

  function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    definirArquivo(f);
    lerNota(f);
  }

  const catSugeridaId =
    dados && categorias.find((c) => c.nome === dados.categoriaSugerida)?.id;
  const valorInicial = dados ? dados.valorTotalReais.toFixed(2).replace(".", ",") : "";

  return (
    <div className="max-w-lg">
      {/* Etapa 1: captura / upload */}
      {fase !== "confirmar" && (
        <div className="space-y-4">
          {/* Botão único: no celular abre a câmera; no PC abre o seletor de arquivo */}
          <label className="block">
            <span className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-8 text-center cursor-pointer hover:bg-primary/10">
              <span className="text-3xl">📸</span>
              <span className="font-semibold text-primary">Tirar foto da nota</span>
              <span className="text-xs text-muted">
                Toque para abrir a câmera (ou escolher uma imagem)
              </span>
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              onChange={aoEscolherArquivo}
              disabled={fase === "extraindo"}
              className="hidden"
            />
          </label>

          {preview && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Pré-visualização da nota"
                className="max-h-72 w-full object-contain rounded-lg border border-border"
              />
              {fase === "extraindo" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/60 text-white">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span className="font-medium">🤖 Lendo a nota com IA...</span>
                </div>
              )}
            </div>
          )}

          {erro && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {erro}
            </div>
          )}

          {/* Reprocessar caso a leitura tenha falhado mas a foto continue válida */}
          {arquivo && fase === "upload" && erro && (
            <button
              type="button"
              onClick={() => arquivo && lerNota(arquivo)}
              className="btn w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90"
            >
              Tentar ler novamente
            </button>
          )}
        </div>
      )}

      {/* Etapa 2: confirmação */}
      {fase === "confirmar" && dados && (
        <form
          action={async (fd) => {
            if (enviandoRef.current) return;
            enviandoRef.current = true;
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
              className="btn flex-1 rounded-lg bg-primary px-4 py-4 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            >
              {salvando ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                "Confirmar e salvar saída"
              )}
            </button>
          </div>
        </form>
      )}

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
