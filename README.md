# 🍔 CaixaFood

Sistema de controle de caixa para estabelecimentos de food-service (hamburguerias, pizzarias, lanchonetes, açaiterias). Centraliza **entradas** (vendas) e **saídas** (compras/despesas) e mostra **gráficos** por período (de "hoje" até o ano). Tema escuro minimalista. Leitura de nota fiscal por IA — com foto da câmera ou upload.

## Como rodar

Pré-requisitos: Node.js 18+ instalado.

```bash
npm install          # instala dependências
npm run seed         # cria usuário demo + estabelecimento + plano de contas (rodar 1x)
npm run seed:demo    # (opcional) preenche com dados de exemplo para testar
npm run dev          # sobe o servidor em http://localhost:3000
```

Abra **http://localhost:3000** no navegador. Para parar o servidor: `Ctrl + C` no terminal.

**Entrar:** crie uma conta em **/cadastro** ou use a conta de teste:
- Email: `demo@caixafood.com`
- Senha: `demo1234`

## O que já existe

| Tela | O que faz |
|------|-----------|
| **Login / Cadastro** (`/login`, `/cadastro`) | Conta por email + senha. Cada dono vê só o próprio caixa (multi-estabelecimento). |
| **Dashboard** (`/`) | Resumo de entradas/saídas/saldo, gráfico de fluxo de caixa e gráfico de "para onde vai o dinheiro", com filtro por período (**hoje**, semana, mês, trimestre, semestre, ano). |
| **Lançamentos** (`/lancamentos`) | Lista de todos os lançamentos, com filtro por tipo e exclusão. |
| **Novo lançamento** (`/lancamentos/novo`) | Formulário para registrar entrada ou saída, com categoria. |
| **Importar nota (IA)** (`/lancamentos/importar`) | Tira foto da nota (câmera) ou envia arquivo; a IA lê e preenche a saída para você confirmar. |

## Tecnologias

- **Next.js 16** (React) — front + back juntos
- **Prisma 6 + SQLite** — banco em arquivo (`prisma/dev.db`), sem servidor
- **Recharts** — gráficos
- **Tailwind CSS** — estilo

## Estrutura

```
app/
  page.tsx               # Dashboard
  login/ cadastro/       # Autenticação
  lancamentos/           # Lista, novo, importar (IA) e server actions
  components/            # Sidebar e gráficos
lib/
  prisma.ts              # Conexão com o banco
  auth.ts / senha.ts     # Sessão e hash de senha
  anthropic.ts           # Leitura da nota por IA (visão)
  format.ts              # Formatação de dinheiro (R$) em centavos
  periodo.ts             # Lógica de períodos e agrupamento
prisma/
  schema.prisma          # Modelo de dados
  seed.ts                # Plano de contas inicial
  seed-demo.ts           # Dados de demonstração
```

## Próximos passos (roadmap)

- [x] **Upload de foto da nota** pela web + leitura por IA (Claude visão)
- [x] **Login e multi-estabelecimento** (cada dono vê só o seu caixa)
- [ ] **Integração com WhatsApp** (API oficial) para enviar a nota e registrar automático
- [ ] Edição de lançamentos e gestão de categorias pela interface
- [ ] Relatório mensal em PDF

> 💡 O dinheiro é sempre guardado em **centavos** (número inteiro) no banco, para evitar erros de arredondamento. A formatação para `R$` acontece só na exibição.
