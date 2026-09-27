# TemNoBar API

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
[![CI](https://github.com/erikarg/temnobar-api/actions/workflows/ci.yml/badge.svg)](https://github.com/erikarg/temnobar-api/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **Tem no bar? Tem.** The API that puts your bar's menu in the palm of your hand.

REST API for managing bar menus: products with price, sections, tags and availability history, image upload, and a public menu per bar.

---

## Links

- API: https://temnobar-api.vercel.app
- Interactive docs (Swagger UI): https://temnobar-api.vercel.app/docs — raw spec at `/docs/openapi.json`

It is part of the TemNoBar trio:

| Repo | What it is | Live |
|------|-----------|------|
| **temnobar-api** | This REST API | https://temnobar-api.vercel.app |
| [temnobar-web](https://github.com/erikarg/temnobar-web) | Web back office and public menu (Next.js) | https://temnobar-web.vercel.app |
| [temnobar-app](https://github.com/erikarg/temnobar-app) | Mobile app (Expo / React Native) | — |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 (Docker/CI), Node.js 22 on Vercel |
| Framework | Express 5 |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Auth | JWT (httpOnly cookie or Bearer header) + bcrypt |
| Upload | multer + sharp + Cloudinary |
| Validation | Zod |
| Security | helmet, CORS allow-list, origin guard (CSRF), rate limit on auth |
| Tests | Vitest + Supertest |
| Docs | swagger-jsdoc + Swagger UI (loaded from a pinned CDN) |
| Infrastructure | Vercel (production), Docker Compose (local) |
| CI | GitHub Actions |

---

## Getting started

### With Docker

```bash
git clone https://github.com/erikarg/temnobar-api.git
cd temnobar-api

cp .env.example .env   # set a real JWT_SECRET (32+ chars)

docker compose up -d
```

The API container runs `prisma migrate deploy` on start and then serves on http://localhost:3333 (docs at http://localhost:3333/docs). It reads `JWT_SECRET`, `NODE_ENV`, `API_URL`, `APP_URL` and the Cloudinary variables from `.env`; `DATABASE_URL` points to the `db` service. Uploads need real Cloudinary credentials.

### Without Docker

```bash
npm install
cp .env.example .env        # point DATABASE_URL at your PostgreSQL

npm run db:up               # optional: only the PostgreSQL container
npx prisma generate
npx prisma migrate deploy   # apply the committed migrations
npm run db:seed             # optional: sample menu
npm run dev
```

### Migrations

| Command | When |
|---------|------|
| `npx prisma migrate deploy` | Apply the committed migrations in `prisma/migrations` to a database. Use it for any real database (local, Docker, production). |
| `npm run db:migrate` (`prisma migrate dev`) | Development only: change `schema.prisma` and create a new migration. |
| `npx prisma db push` | Syncs the schema without migration history. Used only for the throwaway test database (test setup and CI). Don't use it on a database managed by migrations. |

### Seed

`npm run db:seed` creates (or updates) a bar with slug `default`, 4 sections (Chopps e Cervejas, Drinks, Sem álcool, Cozinha) and 24 products with prices in cents, tags, real photos on Cloudinary and some availability history. It creates no users: register one and link it to the bar with `POST /auth/select-bar`. The script runs through `prisma db seed`, which loads `.env`; against any database other than `localhost` it refuses to run unless `SEED_ALLOW_REMOTE=true` is set.

### Environment variables

Validated on start by `lib/env.ts`.

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `DATABASE_URL` | yes | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/temnobar` |
| `JWT_SECRET` | yes | JWT signing secret, at least 32 characters | output of `openssl rand -base64 48` |
| `API_URL` | yes | Public base URL of the API (used as the Swagger server) | `http://localhost:3333` |
| `APP_URL` | no | Comma-separated web origins allowed by CORS and the origin guard (default: none) | `http://localhost:3000` |
| `PORT` | no | HTTP port for `server.ts` (default `3333`; unused on Vercel) | `3333` |
| `NODE_ENV` | no | `development` (default), `production` or `test`. `production` makes the cookie `Secure; SameSite=None` | `development` |
| `CLOUDINARY_CLOUD_NAME` | for uploads | Cloudinary cloud name | `my_cloud` |
| `CLOUDINARY_API_KEY` | for uploads | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | for uploads | Cloudinary API secret | — |

---

## Architecture

Modular, feature-based layering: each feature has its own folder with routes, validation schemas and a service; shared infrastructure lives next to it.

```
temnobar-api/
├── api/index.ts         # Vercel function entry (exports the Express app)
├── app.ts               # Express app: middleware, routes, /docs
├── server.ts            # Local/Docker entry (app.listen)
├── modules/
│   ├── auth/            #   Register, login, session, bar selection, logout
│   ├── bar/             #   Bars
│   ├── category/        #   Menu sections of the user's bar
│   ├── product/         #   Products, availability toggle and history, menu health
│   ├── public/          #   Public menu by bar slug (no auth)
│   └── upload/          #   Image processing and Cloudinary upload
├── middleware/          # Error handler, request validation, origin guard
├── lib/                 # env, errors, ids
├── database/            # Prisma client
├── prisma/              # Schema, migrations, seed
├── docs/                # OpenAPI spec and Swagger UI page
├── tests/               # Integration tests
└── .github/workflows/   # CI
```

```
modules/example/
├── example.routes.ts    # Routes + Swagger annotations
├── example.service.ts   # Business logic and database access
└── example.schema.ts    # Zod schemas
```

---

## Authentication

- `register`, `login` and `select-bar` set the JWT (7 days) in an **httpOnly cookie** named `token`. The token is never returned in the response body.
- Protected routes accept the token from the `Authorization: Bearer <token>` header **or** the cookie.
- In production the cookie is `Secure; SameSite=None` (the web app lives on another site); otherwise `SameSite=Lax`.
- Routes that act on a bar resolve the user's bar from the database, not from the token, so a `select-bar` takes effect right away. Users without a bar get `403`.
- CSRF: CORS only allows the `APP_URL` origins, and the origin guard rejects state-changing requests whose `Origin` is not in that list. Requests without `Origin` (native apps, curl) are allowed.
- Passwords are hashed with bcrypt (10 rounds). `register` and `login` are rate limited (20 requests / 15 min per IP).

---

## Endpoints

All routes are under `/api/v1`. "Bar" means authenticated **and** linked to a bar.

### Auth

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `POST` | `/auth/register` | — | Create an account (sets the session cookie) |
| `POST` | `/auth/login` | — | Log in (sets the session cookie) |
| `GET` | `/auth/me` | User | Authenticated user's profile |
| `POST` | `/auth/select-bar` | User | Link the user to a bar (reissues the cookie) |
| `POST` | `/auth/logout` | — | Clear the session cookie |

### Bars

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/bars` | — | List bars |
| `POST` | `/bars` | User | Create a bar |

### Products

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/products` | — | List (pagination, `status`, `search`, `bar_id`, `category_id`) |
| `GET` | `/products/:id` | — | Get one product |
| `POST` | `/products` | Bar | Create a product in the user's bar |
| `PUT` | `/products/:id` | Bar | Update a product of the user's bar |
| `PATCH` | `/products/:id/status` | Bar | Toggle availability (one tap) |
| `GET` | `/products/:id/historico` | Bar | Last 20 availability changes |
| `GET` | `/products/health` | Bar | Menu health: missing photo/price/section, sold out, most often sold out |
| `DELETE` | `/products/:id` | Bar | Delete a product of the user's bar |

Products of another bar answer `404`, so ids of other bars are not revealed. `preco` is an integer in **cents**; `tags` come from a closed list (`sem-alcool`, `low-abv`, `vegetariano`, `vegano`, `sem-gluten`, `autoral`, `novidade`).

### Categories (menu sections)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/categories` | Bar | List sections with item count |
| `POST` | `/categories` | Bar | Create a section (slug derived from the name) |
| `PUT` | `/categories/:id` | Bar | Rename or reorder a section |
| `DELETE` | `/categories/:id` | Bar | Delete a section; its products become uncategorised |

### Public menu

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/public/bares/:slug/cardapio` | — | Menu grouped by section; sold-out items are shown as unavailable |

### Upload

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `POST` | `/upload/image` | User | Upload an image (`multipart/form-data`, field `file`, max 5 MB); returns Cloudinary `url` and `thumb_url` |

### Utilities

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/api/v1/health` | — | Health check |
| `GET` | `/docs` | — | Swagger UI |
| `GET` | `/docs/openapi.json` | — | OpenAPI spec |

### Errors

Errors share one shape: `{ "error": { "code": "...", "message": "..." } }` (`VALIDATION_ERROR` also has `details`).

| Code | Situation |
|------|-----------|
| `VALIDATION_ERROR` | Invalid input (400) |
| `UNAUTHORIZED` | Missing or invalid token (401) |
| `FORBIDDEN` | No bar selected, or origin not allowed (403) |
| `NOT_FOUND` | Resource not found, or not in the user's bar (404) |
| `CONFLICT` | Unique constraint (email, slug, product code within a bar) (409) |
| `TOO_MANY_REQUESTS` | Auth rate limit (429) |
| `INTERNAL_ERROR` | Unexpected error (500) |

---

## Database

```
┌──────────────┐         ┌───────────────────┐
│     User     │         │        Bar        │
├──────────────┤         ├───────────────────┤
│ id           │  bar_id │ id                │
│ email (uniq) │ ──────> │ nome              │
│ name         │ (no FK) │ slug (unique)     │
│ password_hash│         └───┬───────────┬───┘
│ bar_id?      │             │ 1:N       │ 1:N
└──────────────┘             │           │
          ┌──────────────────┴──┐     ┌──┴───────────────────────┐
          │      Category       │     │         Product          │
          ├─────────────────────┤ 1:N ├──────────────────────────┤
          │ id                  │ ──> │ id                       │
          │ nome                │     │ codigo_produto           │
          │ slug (uniq per bar) │     │ descricao_produto        │
          │ ordem               │     │ status (ACTIVE/INACTIVE) │
          │ bar_id (FK)         │     │ preco (int, cents)       │
          └─────────────────────┘     │ tags (text[])            │
                                      │ foto_produto?            │
                                      │ thumb_produto?           │
                                      │ bar_id (FK)              │
                                      │ category_id? (FK, set    │
                                      │   null on delete)        │
                                      └────────────┬─────────────┘
                                                   │ 1:N (cascade)
                                      ┌────────────┴─────────────┐
                                      │  ProductAvailabilityLog  │
                                      ├──────────────────────────┤
                                      │ id                       │
                                      │ product_id (FK)          │
                                      │ bar_id                   │
                                      │ status                   │
                                      │ user_id?                 │
                                      │ created_at               │
                                      └──────────────────────────┘
```

- `codigo_produto` is unique within a bar.
- Every status change (create, update, toggle) writes a `ProductAvailabilityLog` row in the same transaction as the product change.

---

## Tests

```bash
npm run db:up   # PostgreSQL on localhost:5432
npm test
```

**61 integration tests** in 7 files, against a real PostgreSQL:

- The suite always uses the local `temnobar_test` database (created if missing, schema applied with `prisma db push`), whatever your `.env` says, and refuses to run otherwise: every test starts by deleting all rows.
- The Cloudinary upload test calls the real Cloudinary with your `.env` credentials; it is skipped in CI.

| File | Tests | Covers |
|------|:-----:|--------|
| `auth.test.ts` | 12 | Register, login, profile, select-bar, token never in the body |
| `product.test.ts` | 27 | CRUD, pagination, filters, search, ownership, origin guard, price/tags/sections, availability history and its atomicity, menu health |
| `bar.test.ts` | 6 | Create, list, slug validation |
| `category.test.ts` | 6 | Create, list, delete (products kept), ownership |
| `public.test.ts` | 4 | Public menu |
| `upload.test.ts` | 4 | Upload, rejections |
| `docs.test.ts` | 2 | Swagger UI page and OpenAPI spec |

---

## Deployment

Production runs on **Vercel** as a plain Node.js function:

- `api/index.ts` exports the Express app and `vercel.json` rewrites every path to it (`/(.*)` → `/api`). `vercel-build` runs `prisma generate && tsc`, which is also the type check of record.
- `vercel.json` sets `"framework": null` on purpose. Vercel's Express preset re-type-checks the app with its own module resolver, which ignores that the importing files are ESM and resolves dual packages such as helmet and express-rate-limit to their CJS typings, so the build failed with `TS2349 ... has no call signatures` even though `tsc` passed. The preset also used `app.ts` directly, bypassing `api/index.ts` and the rewrites. The plain-function flow requires a `public/` directory, hence `public/.gitkeep`.
- Swagger UI's JS and CSS come from jsDelivr (`swagger-ui-dist`, fixed version, SRI hashes), because the function bundle does not include `swagger-ui-dist`'s static files. The spec is built from the annotations in `modules/**/*.routes.*` next to `docs/swagger`, so it works in dev, in `dist/` and inside the function.
- **Migrations are not applied by the Vercel build.** After merging a schema change, run `npx prisma migrate deploy` against the production database (with its `DATABASE_URL`) before or together with the deploy.
- **Every Vercel environment that builds the project, Preview included, needs all required variables** (`DATABASE_URL`, `JWT_SECRET`, `API_URL`), plus `NODE_ENV=production`, `APP_URL` and the Cloudinary variables. The app validates them on boot and the function crashes without them.
- The web app (`temnobar-web.vercel.app`) and the API (`temnobar-api.vercel.app`) are different sites, so the session cookie is `SameSite=None` and, for the browser, a third-party cookie. Browsers that block third-party cookies can break the web login.

---

## CI

GitHub Actions on pushes and PRs to `main`: `npm ci`, `prisma generate`, lint, `tsc --noEmit`, `prisma db push` to a PostgreSQL service, tests, build.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with reload (`tsx watch`) |
| `npm run build` | `prisma generate` + compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Tests |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Seed the sample menu |
| `npm run db:studio` | Prisma Studio |
| `npm run db:up` | Start only the PostgreSQL container |
| `npm run docker:up` / `docker:down` | Start / stop the whole Docker stack |

---

## License

Personal-use project. Ask the author before reusing it.

---

<details>
<summary>Português</summary>

# TemNoBar API

> **Tem no bar? Tem.** A API que coloca o cardápio do seu bar na palma da mão.

API REST para gerenciar cardápios de bares: produtos com preço, seções, tags e histórico de disponibilidade, upload de imagens e um cardápio público por bar.

## Links

- API: https://temnobar-api.vercel.app
- Documentação interativa (Swagger UI): https://temnobar-api.vercel.app/docs — spec em `/docs/openapi.json`

Faz parte do trio TemNoBar:

| Repositório | O que é | No ar |
|-------------|---------|-------|
| **temnobar-api** | Esta API REST | https://temnobar-api.vercel.app |
| [temnobar-web](https://github.com/erikarg/temnobar-web) | Back office web e cardápio público (Next.js) | https://temnobar-web.vercel.app |
| [temnobar-app](https://github.com/erikarg/temnobar-app) | App mobile (Expo / React Native) | — |

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20 (Docker/CI), Node.js 22 na Vercel |
| Framework | Express 5 |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL 16 |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Autenticação | JWT (cookie httpOnly ou header Bearer) + bcrypt |
| Upload | multer + sharp + Cloudinary |
| Validação | Zod |
| Segurança | helmet, allow-list de CORS, origin guard (CSRF), rate limit na autenticação |
| Testes | Vitest + Supertest |
| Documentação | swagger-jsdoc + Swagger UI (carregado de CDN com versão fixa) |
| Infraestrutura | Vercel (produção), Docker Compose (local) |
| CI | GitHub Actions |

## Início rápido

### Com Docker

```bash
git clone https://github.com/erikarg/temnobar-api.git
cd temnobar-api

cp .env.example .env   # defina um JWT_SECRET de verdade (32+ caracteres)

docker compose up -d
```

O container da API roda `prisma migrate deploy` ao subir e atende em http://localhost:3333 (docs em http://localhost:3333/docs). Ele lê `JWT_SECRET`, `NODE_ENV`, `API_URL`, `APP_URL` e as variáveis do Cloudinary do `.env`; o `DATABASE_URL` aponta para o serviço `db`. O upload precisa de credenciais reais do Cloudinary.

### Sem Docker

```bash
npm install
cp .env.example .env        # aponte DATABASE_URL para o seu PostgreSQL

npm run db:up               # opcional: só o container do PostgreSQL
npx prisma generate
npx prisma migrate deploy   # aplica as migrations versionadas
npm run db:seed             # opcional: cardápio de exemplo
npm run dev
```

### Migrations

| Comando | Quando usar |
|---------|-------------|
| `npx prisma migrate deploy` | Aplica as migrations de `prisma/migrations` em um banco. Use em qualquer banco de verdade (local, Docker, produção). |
| `npm run db:migrate` (`prisma migrate dev`) | Só em desenvolvimento: alterar o `schema.prisma` e criar uma nova migration. |
| `npx prisma db push` | Sincroniza o schema sem histórico de migrations. Usado só no banco descartável de testes (setup dos testes e CI). Não use em um banco gerenciado por migrations. |

### Seed

`npm run db:seed` cria (ou atualiza) um bar com slug `default`, 4 seções (Chopps e Cervejas, Drinks, Sem álcool, Cozinha) e 24 produtos com preço em centavos, tags, fotos reais no Cloudinary e algum histórico de disponibilidade. Não cria usuários: cadastre um e vincule ao bar com `POST /auth/select-bar`. O script roda via `prisma db seed`, que carrega o `.env`; em qualquer banco que não seja `localhost` ele se recusa a rodar sem `SEED_ALLOW_REMOTE=true`.

### Variáveis de ambiente

Validadas na inicialização por `lib/env.ts`.

| Variável | Obrigatória | Descrição | Exemplo |
|----------|:-----------:|-----------|---------|
| `DATABASE_URL` | sim | String de conexão do PostgreSQL | `postgresql://postgres:postgres@localhost:5432/temnobar` |
| `JWT_SECRET` | sim | Segredo de assinatura do JWT, no mínimo 32 caracteres | saída de `openssl rand -base64 48` |
| `API_URL` | sim | URL pública da API (usada como servidor no Swagger) | `http://localhost:3333` |
| `APP_URL` | não | Origens web, separadas por vírgula, liberadas no CORS e no origin guard (padrão: nenhuma) | `http://localhost:3000` |
| `PORT` | não | Porta HTTP do `server.ts` (padrão `3333`; não usada na Vercel) | `3333` |
| `NODE_ENV` | não | `development` (padrão), `production` ou `test`. Em `production` o cookie é `Secure; SameSite=None` | `development` |
| `CLOUDINARY_CLOUD_NAME` | para upload | Nome do cloud no Cloudinary | `my_cloud` |
| `CLOUDINARY_API_KEY` | para upload | API key do Cloudinary | `123456789` |
| `CLOUDINARY_API_SECRET` | para upload | API secret do Cloudinary | — |

## Arquitetura

Camadas modulares, organizadas por funcionalidade: cada funcionalidade tem sua pasta com rotas, schemas de validação e service; a infraestrutura compartilhada fica ao lado.

```
temnobar-api/
├── api/index.ts         # Entrada da função na Vercel (exporta o app Express)
├── app.ts               # App Express: middlewares, rotas, /docs
├── server.ts            # Entrada local/Docker (app.listen)
├── modules/
│   ├── auth/            #   Cadastro, login, sessão, seleção de bar, logout
│   ├── bar/             #   Bares
│   ├── category/        #   Seções do cardápio do bar do usuário
│   ├── product/         #   Produtos, disponibilidade e histórico, saúde do cardápio
│   ├── public/          #   Cardápio público pelo slug do bar (sem autenticação)
│   └── upload/          #   Processamento de imagem e upload no Cloudinary
├── middleware/          # Error handler, validação, origin guard
├── lib/                 # env, erros, ids
├── database/            # Prisma client
├── prisma/              # Schema, migrations, seed
├── docs/                # Spec OpenAPI e página do Swagger UI
├── tests/               # Testes de integração
└── .github/workflows/   # CI
```

```
modules/exemplo/
├── exemplo.routes.ts    # Rotas + anotações do Swagger
├── exemplo.service.ts   # Regras de negócio e acesso ao banco
└── exemplo.schema.ts    # Schemas Zod
```

## Autenticação

- `register`, `login` e `select-bar` enviam o JWT (7 dias) em um **cookie httpOnly** chamado `token`. O token nunca vem no corpo da resposta.
- Rotas protegidas aceitam o token pelo header `Authorization: Bearer <token>` **ou** pelo cookie.
- Em produção o cookie é `Secure; SameSite=None` (o app web está em outro site); fora dela, `SameSite=Lax`.
- Rotas que atuam em um bar buscam o bar do usuário no banco, não no token, então um `select-bar` vale na hora. Usuário sem bar recebe `403`.
- CSRF: o CORS só libera as origens de `APP_URL`, e o origin guard rejeita requisições que alteram estado com `Origin` fora dessa lista. Requisições sem `Origin` (apps nativos, curl) passam.
- Senhas com bcrypt (10 rounds). `register` e `login` têm rate limit (20 requisições / 15 min por IP).

## Endpoints

Todas as rotas ficam em `/api/v1`. "Bar" significa autenticado **e** vinculado a um bar.

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `POST` | `/auth/register` | — | Cria uma conta (define o cookie de sessão) |
| `POST` | `/auth/login` | — | Login (define o cookie de sessão) |
| `GET` | `/auth/me` | Usuário | Perfil do usuário autenticado |
| `POST` | `/auth/select-bar` | Usuário | Vincula o usuário a um bar (reemite o cookie) |
| `POST` | `/auth/logout` | — | Apaga o cookie de sessão |

### Bares

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/bars` | — | Lista os bares |
| `POST` | `/bars` | Usuário | Cria um bar |

### Produtos

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/products` | — | Lista (paginação, `status`, `search`, `bar_id`, `category_id`) |
| `GET` | `/products/:id` | — | Retorna um produto |
| `POST` | `/products` | Bar | Cria um produto no bar do usuário |
| `PUT` | `/products/:id` | Bar | Atualiza um produto do bar do usuário |
| `PATCH` | `/products/:id/status` | Bar | Alterna a disponibilidade (um toque) |
| `GET` | `/products/:id/historico` | Bar | Últimas 20 mudanças de disponibilidade |
| `GET` | `/products/health` | Bar | Saúde do cardápio: sem foto/preço/seção, esgotados, os que mais esgotam |
| `DELETE` | `/products/:id` | Bar | Remove um produto do bar do usuário |

Produtos de outro bar respondem `404`, para não revelar ids de outros bares. `preco` é um inteiro em **centavos**; `tags` vêm de uma lista fechada (`sem-alcool`, `low-abv`, `vegetariano`, `vegano`, `sem-gluten`, `autoral`, `novidade`).

### Categorias (seções do cardápio)

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/categories` | Bar | Lista as seções com a contagem de itens |
| `POST` | `/categories` | Bar | Cria uma seção (slug derivado do nome) |
| `PUT` | `/categories/:id` | Bar | Renomeia ou reordena uma seção |
| `DELETE` | `/categories/:id` | Bar | Exclui a seção; os produtos ficam sem categoria |

### Cardápio público

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/public/bares/:slug/cardapio` | — | Cardápio agrupado por seção; item esgotado aparece como indisponível |

### Upload

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `POST` | `/upload/image` | Usuário | Envia uma imagem (`multipart/form-data`, campo `file`, até 5 MB); retorna `url` e `thumb_url` do Cloudinary |

### Utilitários

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/api/v1/health` | — | Health check |
| `GET` | `/docs` | — | Swagger UI |
| `GET` | `/docs/openapi.json` | — | Spec OpenAPI |

### Erros

Todos os erros têm o mesmo formato: `{ "error": { "code": "...", "message": "..." } }` (`VALIDATION_ERROR` traz também `details`).

| Código | Situação |
|--------|----------|
| `VALIDATION_ERROR` | Entrada inválida (400) |
| `UNAUTHORIZED` | Token ausente ou inválido (401) |
| `FORBIDDEN` | Nenhum bar selecionado, ou origem não permitida (403) |
| `NOT_FOUND` | Recurso inexistente, ou fora do bar do usuário (404) |
| `CONFLICT` | Violação de unicidade (e-mail, slug, código do produto no bar) (409) |
| `TOO_MANY_REQUESTS` | Rate limit da autenticação (429) |
| `INTERNAL_ERROR` | Erro inesperado (500) |

## Banco de dados

Modelos: `User`, `Bar`, `Category`, `Product` e `ProductAvailabilityLog` — veja o diagrama na versão em inglês acima.

- `User.bar_id` referencia o bar sem foreign key.
- `Category` pertence a um bar; `slug` é único por bar; `ordem` define a posição no cardápio.
- `Product` pertence a um bar e, opcionalmente, a uma categoria (vira `null` se a categoria for excluída). `preco` é inteiro em centavos, `tags` é um array de texto e `codigo_produto` é único por bar.
- `ProductAvailabilityLog` guarda cada mudança de status (é apagado junto com o produto). Toda mudança de status (criação, edição, alternância) grava o log na mesma transação da alteração do produto.

## Testes

```bash
npm run db:up   # PostgreSQL em localhost:5432
npm test
```

**61 testes de integração** em 7 arquivos, contra um PostgreSQL de verdade:

- A suíte usa sempre o banco local `temnobar_test` (criado se não existir, schema aplicado com `prisma db push`), independentemente do `.env`, e se recusa a rodar em outro banco: cada teste começa apagando todas as linhas.
- O teste de upload no Cloudinary chama o Cloudinary de verdade com as credenciais do `.env`; ele é pulado na CI.

| Arquivo | Testes | Cobre |
|---------|:------:|-------|
| `auth.test.ts` | 12 | Cadastro, login, perfil, select-bar, token nunca no corpo |
| `product.test.ts` | 27 | CRUD, paginação, filtros, busca, posse, origin guard, preço/tags/seções, histórico de disponibilidade e sua atomicidade, saúde do cardápio |
| `bar.test.ts` | 6 | Criação, listagem, validação de slug |
| `category.test.ts` | 6 | Criação, listagem, exclusão (produtos preservados), posse |
| `public.test.ts` | 4 | Cardápio público |
| `upload.test.ts` | 4 | Upload, rejeições |
| `docs.test.ts` | 2 | Página do Swagger UI e spec OpenAPI |

## Deploy

A produção roda na **Vercel** como uma função Node.js simples:

- `api/index.ts` exporta o app Express e o `vercel.json` reescreve todos os caminhos para ele (`/(.*)` → `/api`). O `vercel-build` roda `prisma generate && tsc`, que também é a checagem de tipos oficial.
- O `vercel.json` define `"framework": null` de propósito. O preset de Express da Vercel checa os tipos de novo com um resolvedor de módulos próprio, que ignora que os arquivos são ESM e resolve pacotes duais como helmet e express-rate-limit para as tipagens CJS; por isso o build falhava com `TS2349 ... has no call signatures` mesmo com o `tsc` passando. O preset também usava o `app.ts` direto, ignorando o `api/index.ts` e os rewrites. O fluxo de função simples exige um diretório `public/`, daí o `public/.gitkeep`.
- O JS e o CSS do Swagger UI vêm do jsDelivr (`swagger-ui-dist`, versão fixa, hashes SRI), porque o bundle da função não inclui os arquivos estáticos do `swagger-ui-dist`. A spec é montada a partir das anotações em `modules/**/*.routes.*` ao lado de `docs/swagger`, então funciona em dev, no `dist/` e dentro da função.
- **O build da Vercel não aplica migrations.** Depois de mergear uma mudança de schema, rode `npx prisma migrate deploy` contra o banco de produção (com o `DATABASE_URL` dele) antes do deploy ou junto com ele.
- **Todo ambiente da Vercel que builda o projeto, inclusive Preview, precisa de todas as variáveis obrigatórias** (`DATABASE_URL`, `JWT_SECRET`, `API_URL`), além de `NODE_ENV=production`, `APP_URL` e as do Cloudinary. O app as valida na inicialização e a função cai sem elas.
- O app web (`temnobar-web.vercel.app`) e a API (`temnobar-api.vercel.app`) são sites diferentes, então o cookie de sessão é `SameSite=None` e, para o navegador, um cookie de terceiros. Navegadores que bloqueiam cookies de terceiros podem quebrar o login no web.

## CI

GitHub Actions em pushes e PRs para `main`: `npm ci`, `prisma generate`, lint, `tsc --noEmit`, `prisma db push` em um serviço PostgreSQL, testes e build.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com reload (`tsx watch`) |
| `npm run build` | `prisma generate` + compila para `dist/` |
| `npm start` | Executa o build compilado |
| `npm test` | Testes |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Popula o cardápio de exemplo |
| `npm run db:studio` | Prisma Studio |
| `npm run db:up` | Sobe só o container do PostgreSQL |
| `npm run docker:up` / `docker:down` | Sobe / derruba toda a stack Docker |

## Licença

Projeto de uso pessoal. Consulte a autora antes de reutilizar.

</details>
