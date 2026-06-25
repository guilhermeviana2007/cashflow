"use client";

import { useState, useRef, useEffect } from "react";

type Mensagem = {
  role: "user" | "assistant";
  content: string;
};

const SUGESTOES = [
  "Como adicionar um lançamento?",
  "Como importar uma nota fiscal?",
  "Como configurar as taxas de cartão?",
  "Como editar um lançamento já criado?",
];

export default function SuportePage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [semChave, setSemChave] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar(texto: string) {
    if (!texto.trim() || enviando) return;

    const novasMensagens: Mensagem[] = [
      ...mensagens,
      { role: "user", content: texto.trim() },
    ];
    setMensagens(novasMensagens);
    setInput("");
    setEnviando(true);

    // Adiciona mensagem vazia do assistente que vai sendo preenchida
    setMensagens((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/suporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: novasMensagens }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.erro === "SEM_CHAVE") {
          setSemChave(true);
          setMensagens((prev) =>
            prev.slice(0, -1).concat({
              role: "assistant",
              content:
                "⚠️ A chave da API não está configurada. Adicione ANTHROPIC_API_KEY no arquivo .env e reinicie o servidor.",
            })
          );
        } else {
          setMensagens((prev) =>
            prev.slice(0, -1).concat({
              role: "assistant",
              content: "Ocorreu um erro. Tente novamente.",
            })
          );
        }
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        setMensagens((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: acumulado },
        ]);
      }
    } catch {
      setMensagens((prev) =>
        prev.slice(0, -1).concat({
          role: "assistant",
          content: "Não consegui me conectar. Verifique sua internet e tente novamente.",
        })
      );
    } finally {
      setEnviando(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    enviar(input);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted">Tire suas dúvidas sobre o Cash Flow com a IA.</p>
      </div>

      {semChave && (
        <div className="rounded-lg border border-danger bg-card px-4 py-3 text-sm text-danger mb-4">
          Chave da API não configurada. Adicione <code>ANTHROPIC_API_KEY</code> no{" "}
          <code>.env</code> e reinicie o servidor.
        </div>
      )}

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-4 mb-4">
        {mensagens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
            <div>
              <div className="text-4xl mb-2">💬</div>
              <p className="text-muted text-sm">
                Pergunte qualquer coisa sobre o Cash Flow.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-muted hover:border-primary hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensagens.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-border text-muted"
                }`}
              >
                {m.role === "user" ? "V" : "CF"}
              </div>
              <div
                className={`rounded-xl px-4 py-2.5 text-sm max-w-[80%] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground"
                } ${m.content === "" ? "animate-pulse" : ""}`}
              >
                {m.content || "…"}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={enviando}
          placeholder="Digite sua dúvida..."
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(input);
            }
          }}
        />
        <button
          type="submit"
          disabled={enviando || !input.trim()}
          className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          {enviando ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
