# Taskfy

Gerenciador de tarefas por grupos. Crie grupos temáticos (ex: "English"), cada um com
suas tarefas fixas (diárias, semanais) ou avulsas (com/sem data), checklist e streak.

## Stack

React + TypeScript + Vite, Zustand (estado), Supabase (Postgres + autenticação),
Vitest (testes de domínio).

## Setup

1. Instale as dependências:
   ```
   npm install
   ```

2. Crie um projeto em [supabase.com](https://supabase.com) (free tier).

3. No **SQL Editor** do projeto, rode o conteúdo de [supabase/schema.sql](supabase/schema.sql)
   inteiro. Isso cria as tabelas `groups`, `tasks`, `completions` e as políticas de
   Row Level Security (cada usuário só enxerga/altera os próprios dados).

4. Em **Authentication → Sign In / Providers → Email**, desligue **"Confirm email"**
   (recomendado para uso pessoal/entre amigos — sem isso, cada cadastro precisaria
   confirmar por link de email antes do primeiro login).

5. Copie `.env.example` para `.env.local` e preencha com os dados do seu projeto
   (**Project Settings → API**):
   ```
   cp .env.example .env.local
   ```

6. Rode o app:
   ```
   npm run dev
   ```

Cada pessoa que se cadastrar (email + senha) ganha seus próprios grupos e tarefas,
com o grupo "English" de exemplo semeado automaticamente no primeiro login.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (`tsc -b && vite build`)
- `npm test` — testes de domínio (Vitest)
- `npm run lint` — oxlint
