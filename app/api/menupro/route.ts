import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// API pública que recebe os cadastros do site MenuPro (outro domínio) e salva
// no mesmo banco — aparecem no painel /admin/menupro.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Preflight do navegador (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, mensagem: "Dados inválidos." },
      { status: 400, headers: CORS }
    );
  }

  const nomeResponsavel = str(body.nomeResponsavel);
  const telefone = str(body.telefone);
  const email = str(body.email);
  const nomeEstabelecimento = str(body.nomeEstabelecimento);

  if (!nomeResponsavel || !telefone || !email || !nomeEstabelecimento) {
    return NextResponse.json(
      { ok: false, mensagem: "Preencha nome, telefone, e-mail e nome do estabelecimento." },
      { status: 422, headers: CORS }
    );
  }

  try {
    await prisma.formularioMenuPro.create({
      data: {
        nomeResponsavel,
        telefone,
        email,
        cnpj: str(body.cnpj),
        telefoneLoja: str(body.telefoneLoja) || null,
        nomeEstabelecimento,
        marketplaces: str(body.marketplaces),
        trabalhaMesas: str(body.trabalhaMesas) || "Não informado",
        entregaPropria: str(body.entregaPropria) || "Não informado",
        horarioFuncionamento: str(body.horarioFuncionamento) || null,
        taxaEntrega: str(body.taxaEntrega) || null,
        cep: str(body.cep) || null,
        logradouro: str(body.logradouro) || null,
        numero: str(body.numero) || null,
        complemento: str(body.complemento) || null,
        bairro: str(body.bairro) || null,
        cidade: str(body.cidade) || null,
        estado: str(body.estado) || null,
        formasPagamento: str(body.formasPagamento) || null,
        cardapioLogin: str(body.cardapioLogin) || null,
        cardapioSenha: str(body.cardapioSenha) || null,
        ifoodLogin: str(body.ifoodLogin) || null,
        ifoodSenha: str(body.ifoodSenha) || null,
        noveNoveLogin: str(body.noveNoveLogin) || null,
        noveNoveSenha: str(body.noveNoveSenha) || null,
        sistemaFinanceiro: str(body.sistemaFinanceiro) || null,
        canaisAtendimento: str(body.canaisAtendimento) || null,
        temFotos: str(body.temFotos) || "Não informado",
        repasseTipoDocumento: str(body.repasseTipoDocumento) || null,
        repasseDocumento: str(body.repasseDocumento) || null,
        repasseNomeCompleto: str(body.repasseNomeCompleto) || null,
        repasseDataNascimento: str(body.repasseDataNascimento) || null,
        repasseOcupacao: str(body.repasseOcupacao) || null,
        repasseNomeMae: str(body.repasseNomeMae) || null,
        repasseCep: str(body.repasseCep) || null,
        repasseEndereco: str(body.repasseEndereco) || null,
        repasseNumero: str(body.repasseNumero) || null,
        repasseComplemento: str(body.repasseComplemento) || null,
        repasseBairro: str(body.repasseBairro) || null,
        repasseCidade: str(body.repasseCidade) || null,
        repasseEstado: str(body.repasseEstado) || null,
        repasseTipoChavePix: str(body.repasseTipoChavePix) || null,
        repasseChavePix: str(body.repasseChavePix) || null,
        repasseBanco: str(body.repasseBanco) || null,
        repasseTipoConta: str(body.repasseTipoConta) || null,
        repasseAgencia: str(body.repasseAgencia) || null,
        repasseConta: str(body.repasseConta) || null,
        repasseEmail: str(body.repasseEmail) || null,
        repasseCelular: str(body.repasseCelular) || null,
      },
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    console.error("Erro ao salvar formulário MenuPro (API):", e);
    return NextResponse.json(
      { ok: false, mensagem: "Erro ao enviar. Tente novamente." },
      { status: 500, headers: CORS }
    );
  }
}
