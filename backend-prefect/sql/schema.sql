-- Esquema de la base de datos (Supabase → SQL Editor → pegar y "Run").
-- Supabase es SOLO la base de datos: toda la lógica vive en el backend FastAPI.

create table if not exists public.users (
    id            uuid primary key default gen_random_uuid(),
    username      text not null unique,
    email         text not null unique,
    password_hash text not null,                 -- Argon2, nunca la contraseña
    created_at    timestamptz not null default now()
);

-- Máquina de estados del 2FA: PENDING_VERIFICATION → ACTIVE.
create table if not exists public.mfa_config (
    user_id           uuid primary key references public.users (id) on delete cascade,
    secret_ciphertext jsonb not null,            -- ML-KEM-768 + AES-256-GCM, nunca el secreto en claro
    status            text not null check (status in ('PENDING_VERIFICATION', 'ACTIVE')),
    created_at        timestamptz not null default now(),
    activated_at      timestamptz
);

create table if not exists public.backup_codes (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references public.users (id) on delete cascade,
    code_hash  text not null,                    -- Argon2, nunca el código
    used_at    timestamptz,                      -- null = disponible (un solo uso)
    created_at timestamptz not null default now()
);

create index if not exists backup_codes_user_idx on public.backup_codes (user_id);

-- Defensa en profundidad: aunque la Data API esté apagada, los roles públicos
-- de Supabase (anon, authenticated) no tienen ningún permiso sobre las tablas...
revoke all on public.users, public.mfa_config, public.backup_codes from anon, authenticated;

-- ...y RLS sin políticas: nadie ve filas por la API. El backend se conecta como el
-- dueño de las tablas (postgres), que no pasa por RLS.
alter table public.users enable row level security;
alter table public.mfa_config enable row level security;
alter table public.backup_codes enable row level security;
