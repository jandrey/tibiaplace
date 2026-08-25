# TibiaPlace

Marketplace **RubinOT-only** para venda de personagens, Rubini Coins e itens. O admin importa dados do Bazaar oficial do RubinOT, edita preço/descrição/privacidade e publica na vitrine pública com contato via WhatsApp.

---

## Índice

1. [Stack](#stack)
2. [Funcionalidades](#funcionalidades)
3. [Estrutura do projeto](#estrutura-do-projeto)
4. [Setup local](#setup-local)
5. [Variáveis de ambiente](#variáveis-de-ambiente)
6. [Banco de dados](#banco-de-dados)
7. [Autenticação e admin](#autenticação-e-admin)
8. [Importação do Bazaar RubinOT](#importação-do-bazaar-rubinot)
9. [Skills e progresso](#skills-e-progresso)
10. [Privacidade do personagem](#privacidade-do-personagem)
11. [Páginas públicas](#páginas-públicas)
12. [Painel admin](#painel-admin)
13. [API interna](#api-interna)
14. [Scripts npm](#scripts-npm)
15. [Deploy (Vercel)](#deploy-vercel)
16. [Flags e recursos desativados](#flags-e-recursos-desativados)

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| Backend | Route Handlers (`src/app/api`) |
| Banco | Neon PostgreSQL + Drizzle ORM |
| Auth | Better Auth (e-mail/senha, sessão) |
| Storage | Cloudflare R2 (S3-compatible) — fotos extras (UI desativada) |
| Validação | Zod |

---

## Funcionalidades

### Tipos de anúncio (`listing_type`)

| Tipo | Rota pública | Descrição |
|------|--------------|-----------|
| `character` | `/chars/[slug]` | Personagem importado do Bazaar ou cadastro manual |
| `rubini_coins` | `/coins` | Venda de Rubini Coins por servidor |
| `items` | `/items/[slug]` | Item avulso (nome, sprite URL, tier, quantidade) |

### Home (`/`)

- Hub com abas: **Personagens**, **Rubini Coins**, **Itens**, **Intermédio**
- Cards compactos com outfit/sprite, preço BRL + coins, skills (chars), badges
- Link para `/intermediario` (serviço de intermediação)

### Personagens

- Importação via URL `https://rubinot.com.br/bazaar/{id}`
- Snapshot completo em JSON (`snapshot_data`): outfits, mounts, items, charms, bosstiary, bestiary, gems, achievements, weapon proficiency, etc.
- Editor admin em duas colunas: dados do char + sidebar (publicação, privacidade, bazaar)
- Sincronização com o Bazaar (re-import preservando preço, slug, privacidade)
- Página pública com tabs de detalhes (outfits, mounts, items, charms, bênçãos, etc.)
- Cálculo de **% de skills** a partir de `*Tries` e `manaSpent` (fórmulas Tibia/RubinOT por vocação)
- Toggles de privacidade (nome, ouro, storages, e-mail)

### Rubini Coins e Itens

- Formulários dedicados no admin (`/admin/listings/new`)
- Listagem e detalhe públicos
- WhatsApp com mensagem pré-preenchida

---

## Estrutura do projeto

```
tibiaplace/
├── src/
│   ├── app/                    # Rotas Next.js
│   │   ├── page.tsx            # Home / marketplace hub
│   │   ├── chars/              # Listagem e detalhe de personagens
│   │   ├── coins/              # Rubini Coins
│   │   ├── items/              # Itens
│   │   ├── intermediario/      # Página de intermediação
│   │   ├── login/              # Login admin
│   │   ├── admin/              # Painel administrativo
│   │   └── api/                # REST (listings, bazaar, auth, worlds, catalog)
│   ├── components/             # UI (cards, forms, catalog picker, skill bars, tabs)
│   └── lib/
│       ├── bazaar/               # Importador, skills, snapshot, catálogos JSON
│       ├── db/                 # Drizzle schema + conexão Neon
│       ├── listings/           # Tipos, slug, rotas, features flags
│       ├── queries/            # Queries de listagem
│       ├── auth/               # Better Auth
│       ├── r2/                 # Upload Cloudflare R2
│       └── settings/           # WhatsApp, coins shop
├── scripts/                    # Seed catálogo, admin master, build JSONs
├── data/                       # Amostras de bazaar (dev)
├── drizzle.config.ts
├── .env.example
└── package.json
```

---

## Setup local

### 1. Clonar e instalar

```bash
git clone git@github.com:jandrey/tibiaplace.git
cd tibiaplace
npm install
```

### 2. Ambiente

```bash
cp .env.example .env.local
```

Preencha todas as variáveis (ver seção abaixo).

### 3. Banco

Crie um projeto no [Neon](https://neon.tech), copie a `DATABASE_URL` e rode:

```bash
npm run db:push
```

Isso cria/atualiza todas as tabelas (`listings`, catálogos, auth, etc.).

### 4. Conta admin mestra

```bash
npm run admin:ensure-master
```

Usa `MASTER_ADMIN_EMAIL` e `MASTER_ADMIN_PASSWORD` do `.env.local`. Cadastro público está desabilitado — só esta conta acessa `/admin`.

### 5. Dev server

```bash
npm run dev
```

- Site: http://localhost:3000  
- Login: http://localhost:3000/login  
- Admin: http://localhost:3000/admin  

### 6. Configurar WhatsApp

Em `/admin/settings`, defina o número usado nos botões "Tenho interesse" da vitrine.

### 7. Primeiro personagem

1. `/admin/listings/new` → aba **Importar do bazaar**
2. Cole a URL, ex.: `https://rubinot.com.br/bazaar/270418`
3. Aguarde a barra de progresso (catálogo + snapshot + relações)
4. Edite preço, descrição, privacidade
5. Status → **Disponível** → Salvar
6. Veja em `/chars` ou na home

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL (Neon) |
| `BETTER_AUTH_SECRET` | Sim | Segredo longo e aleatório para sessões |
| `BETTER_AUTH_URL` | Sim | URL base do app (ex. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Sim | URL pública (links WhatsApp, redirects) |
| `WHATSAPP_NUMBER` | Sim | Número com DDI, ex. `5511999999999` |
| `MASTER_ADMIN_EMAIL` | Sim | E-mail da conta admin única |
| `MASTER_ADMIN_PASSWORD` | Sim | Senha da conta admin |
| `MASTER_ADMIN_NAME` | Não | Nome exibido (default: Admin) |
| `R2_ACCOUNT_ID` | Para fotos extras* | Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Para fotos extras* | |
| `R2_SECRET_ACCESS_KEY` | Para fotos extras* | |
| `R2_BUCKET_NAME` | Para fotos extras* | |
| `R2_PUBLIC_URL` | Para fotos extras* | URL pública do bucket |

\* Fotos extras estão **desativadas na UI** (`EXTRA_PHOTOS_ENABLED = false`). R2 só é necessário se reativar no futuro.

**Nunca commite `.env.local`.**

---

## Banco de dados

### Tabela principal: `listings`

Campos relevantes:

- Identidade: `slug`, `type`, `status`, `title`, `description`
- Preço: `price_brl`, `price_coins`
- Char: `character_name`, `level`, `vocation`, `world_name`, `look_*`, `experience`, `gold`
- Meta: `bazaar_id`, `bazaar_url`, `snapshot_data` (JSON completo do Bazaar)
- `privacy_toggles` (JSON): ocultar nome, ouro, storages, e-mail
- `type_data` (JSON): dados específicos de coins/items
- Timestamps: `published_at`, `last_synced_at`, etc.

### Relações do personagem

Tabelas normalizadas ligadas a `listing_id`:

- `listing_outfits`, `listing_mounts`, `listing_items`
- `listing_charms`, `listing_blessings`, `listing_achievements`
- `listing_bosstiaries`, `listing_bestiary`, `listing_gems`
- `listing_titles`, `listing_weapon_proficiency`

### Catálogo global

`catalog_outfits`, `catalog_mounts`, `catalog_items`, etc. — populados automaticamente na importação do Bazaar para sprites e nomes consistentes no picker admin.

### Auth (Better Auth)

`user`, `session`, `account`, `verification`

### Status do anúncio

| Status | Comportamento |
|--------|----------------|
| `draft` | Só admin vê |
| `available` | Vitrine pública + WhatsApp |
| `reserved` | Admin |
| `sold` | Detalhe pode mostrar "Vendido" |
| `archived` | Oculto (404 na vitrine) |

---

## Autenticação e admin

- **Better Auth** em `/api/auth/[...all]`
- Middleware de sessão: `requireAdminSession()` nas rotas `/api/admin/*`
- Uma conta mestra criada via `npm run admin:ensure-master`
- Rotas admin: listagens, edição, import/sync bazaar, catálogo, settings

---

## Importação do Bazaar RubinOT

### API externa

```
GET https://rubinot.com.br/api/bazaar/{id}
```

Retorna JSON com `player`, `general`, `outfits`, `mounts`, `items`, `charms`, `bosstiaries`, etc. **Não envia % de skills prontas** — só level + `*Tries` + `magLevel` + `manaSpent`.

### Fluxo interno

1. `fetchBazaarData(id)` — download
2. `enrichBazaarSnapshot()` — normaliza skills, calcula `skillPercents` e `levelPercent`
3. `upsertCatalogFromBazaar()` — atualiza catálogo global
4. `insert(listings)` + relações (outfits, mounts, …)
5. Progresso SSE via `import-progress` (barra no admin)

### Sync

`POST /api/admin/listings/[id]/sync` — re-baixa o Bazaar, preserva preço, slug, título, descrição, privacidade, status.

---

## Skills e progresso

Arquivo: `src/lib/bazaar/skills.ts`

### Combat skills

Fórmula Tibia padrão (rate `1.1`, offset `10`):

```
triesRequired = base × 1.1^(level − offset)
percent = min(100, tries / triesRequired × 100)
```

Bases por skill: fist/club/sword/axe `50`, dist `30`, shield `100`, fishing `20`.

### Magic level (por vocação)

| Vocação | Fórmula |
|---------|---------|
| MS / ED / Monk | `1600 × 1.1^magLevel` |
| Paladin | `1600 × 1.4^magLevel` |
| Knight | `1600 × 3.0^magLevel` |

`percent = manaSpent / required × 100`

### Onde aparece

- Cards da vitrine (`ListingCard` + `SkillGrid`)
- Detalhe `/chars/[slug]`
- Admin (editor de skills com level + %)

---

## Privacidade do personagem

JSON em `listings.privacy_toggles`:

| Toggle | Efeito |
|--------|--------|
| `hideCharacterName` | Oculta nome real (usa título ou snapshot) |
| `hideGold` | Oculta ouro na página pública |
| `hideStorages` | Oculta storages nas tabs |
| `hideAccountEmail` | Referência para dados sensíveis |

No admin, alterações de privacidade **salvam automaticamente** (PATCH imediato).

Nome exibido: coluna `character_name` ou fallback `snapshot.player.name` (`resolveCharacterName`).

---

## Páginas públicas

| Rota | Conteúdo |
|------|----------|
| `/` | Hub com tabs e cards |
| `/chars` | Filtros: vocação, mundo, level, preço |
| `/chars/[slug]` | Detalhe completo do personagem |
| `/coins` | Listagem de pacotes de coins |
| `/items` | Grid de itens |
| `/items/[slug]` | Detalhe do item + WhatsApp |
| `/intermediario` | Serviço de intermediação |

WhatsApp: mensagem com URL do anúncio, nome, mundo e preço (`buildInterestMessage`).

---

## Painel admin

| Rota | Função |
|------|--------|
| `/admin` | Dashboard |
| `/admin/listings` | Lista todos os anúncios |
| `/admin/listings/new` | Import bazaar / manual (char, coins, item) |
| `/admin/listings/[id]` | Edição completa + sync + publicação |
| `/admin/settings` | WhatsApp, coins shop |

### Editor de personagem

- Formulário principal: stats, skills, outfits (catalog picker), mounts, bênçãos
- Sidebar: slug, status, destaque, **privacidade**, link bazaar
- Modal de cores de outfit (paleta Tibia 133 cores)
- Salvar persiste listing + snapshot parcial

---

## API interna

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/admin/bazaar/import` | Importa bazaar → listing (SSE progress) |
| GET/PATCH/DELETE | `/api/admin/listings/[id]` | CRUD listing |
| GET | `/api/admin/listings/[id]/detail` | Dados para o editor |
| POST | `/api/admin/listings/[id]/sync` | Re-sync bazaar |
| POST/DELETE | `/api/admin/listings/[id]/images` | Fotos extras (UI off) |
| GET/POST | `/api/admin/listings` | Listar / criar |
| GET/PATCH | `/api/admin/settings` | Settings globais |
| GET | `/api/admin/catalog` | Catálogo (outfits, mounts, …) |
| GET | `/api/worlds` | Mundos RubinOT |
| GET | `/api/outfit-sprite` | Proxy sprite outfit |
| * | `/api/auth/[...all]` | Better Auth |

---

## Scripts npm

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build produção |
| `npm run start` | Servidor produção |
| `npm run lint` | ESLint |
| `npm run db:push` | Push schema Drizzle → Neon |
| `npm run db:generate` | Gera migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed:catalog` | Seed catálogo manual |
| `npm run admin:ensure-master` | Cria/atualiza admin mestre |
| `npm run catalog:build` | Regenera JSONs de catálogo |

---

## Deploy (Vercel)

1. Conecte o repo GitHub à Vercel
2. Configure **todas** as env vars (mesmas do `.env.example`)
3. Deploy → rode `npm run admin:ensure-master` localmente apontando para o Neon de produção **ou** configure as vars e rode via CI one-off
4. `npm run db:push` contra o Neon de produção (uma vez por mudança de schema)

Build command: `npm run build`  
Output: Next.js default

---

## Flags e recursos desativados

### Fotos extras (`src/lib/listings/features.ts`)

```ts
export const EXTRA_PHOTOS_ENABLED = false;
```

- Tabela `listing_images` e API R2 **permanecem no código**
- UI de upload/galeria **oculta** no admin e nas páginas públicas
- Para reativar: mude para `true`

### Checklist de entrega

- **Removido** do schema, APIs e UI (não faz sentido para o fluxo atual)
- Após pull, rode `npm run db:push` para dropar a coluna `delivery_checklist` no Neon

---

## Licença

Projeto privado — uso interno TibiaPlace / RubinOT marketplace.
