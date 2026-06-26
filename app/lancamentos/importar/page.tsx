import { redirect } from "next/navigation";

// A leitura por foto/IA foi integrada à tela "Novo lançamento" (aba "Foto da nota").
// Mantém esta rota funcionando para links antigos.
export default function ImportarNotaPage() {
  redirect("/lancamentos/novo");
}
