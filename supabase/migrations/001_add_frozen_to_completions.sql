-- Adiciona o suporte a "freeze de streak" a um banco que já rodou o schema.sql original.
-- Rode isto no SQL Editor do seu projeto Supabase (idempotente — pode rodar mais de uma vez).

alter table completions
  add column if not exists frozen boolean not null default false;
