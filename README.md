# FinDash — Finanças Pessoais SaaS

App de controle financeiro pessoal com IA, construído com Next.js 15, Supabase e TypeScript.

## Stack

- **Frontend**: Next.js 15 App Router, React 19, TypeScript
- **Banco de dados**: Supabase (PostgreSQL + Auth + RLS)
- **Estado**: TanStack Query v5
- **UI**: Tailwind CSS, Framer Motion, Recharts
- **Ícones**: Tabler Icons
- **IA**: FinSmart (análise em linguagem natural via Supabase)

## Estrutura

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Tela de login
│   │   └── cadastro/       # Tela de cadastro
│   ├── dashboard/
│   │   ├── page.tsx        # Home com FinSmart + resumo
│   │   ├── extrato/        # Lista de transações
│   │   ├── contas/         # Contas a pagar/receber
│   │   ├── fluxo/          # Fluxo de caixa (chart)
│   │   ├── categorias/     # Gastos por categoria
│   │   ├── metas/          # Metas financeiras
│   │   ├── health/         # FinHealth score
│   │   ├── lancar/         # Formulário de lançamento
│   │   └── config/         # Configurações
│   └── admin/
│       ├── page.tsx        # Dashboard admin
│       ├── usuarios/       # Lista de usuários
│       ├── base/           # Métricas da base
│       └── config/         # Config da plataforma
├── components/
│   ├── layout/ClientShell  # Layout principal com nav
│   ├── fin-smart/          # Componente IA
│   ├── health/             # FinHealthRing + PilarCard
│   └── ui/                 # Card, Button, Badge
├── hooks/                  # React Query hooks
├── lib/
│   ├── ai/                 # Sistema de IA (FinSmart, FinHealth)
│   ├── supabase/           # Client, Server, Middleware
│   └── format.ts           # Formatadores BR
└── types/database.ts       # Tipos TypeScript do schema
```

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie `.env.local.example` para `.env.local`
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Rodar migrations

No Supabase Dashboard → SQL Editor, execute:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_categorias_padrao.sql`
- `supabase/migrations/003_onboarding.sql`
- `supabase/migrations/004_fix_rls_policies.sql`
- `supabase/migrations/005_orcamento_avancado.sql`
- `supabase/migrations/006_cartoes_credito.sql`
- `supabase/migrations/007_importacao_planilhas.sql`

### 4. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`

## Funcionalidades

### Dashboard
- **FinSmart**: IA em linguagem natural para análise financeira
- **Resumo do mês**: entradas, saídas e saldo
- **Fluxo diário**: gráfico de linha
- **Top categorias**: maiores gastos
- **FinHealth mini**: score rápido
- **Alertas de vencimento**: contas próximas

### Extrato
- Lista agrupada por dia
- Busca por descrição
- Filtro por tipo (entrada/saída)

### Contas a Pagar
- Agrupamento: vencidas, hoje, 7 dias, 30 dias, pagas
- Marcar como paga com um clique

### Fluxo de Caixa
- Gráfico combinado barras + linha
- Comparação com mês anterior

### Categorias
- Donut chart interativo
- Lista com progress bar proporcional

### Metas
- Progress animado por meta
- Suporte a múltiplos tipos (economia, limite, reserva...)

### FinHealth
- Score 0-100 em anel animado SVG
- 5 pilares: Controle (25%), Fluxo (25%), Reserva (20%), Dívidas (15%), Metas (15%)
- Histórico mensal em gráfico

### Admin (rota /admin)
- Dashboard com KPIs: usuários, transações, planos
- Lista de usuários com plano e role
- Visão agregada da base
- Configurações globais

## Design

- Dark mode exclusivo (`#06060c`)
- Accent cyan `#00E5FF` + purple `#A855F7`
- Glass cards com backdrop-blur
- Bottom nav mobile flutuante
- Sidebar desktop 240px fixa
- Framer Motion em transições
