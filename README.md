# TemNoBar API

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
[![CI](https://github.com/erikarg/temnobar-api/actions/workflows/ci.yml/badge.svg)](https://github.com/erikarg/temnobar-api/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **Tem no bar? Tem.** A API que coloca o cardápio do seu bar na palma da mão.

API REST moderna e robusta para gerenciamento completo de cardápios de bares. Cadastre produtos, organize por estabelecimento, faça upload de imagens otimizadas e ofereça aos seus clientes uma experiência de consulta rápida e confiável.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL 16 |
| ORM | Prisma |
| Autenticação | JWT + bcrypt |
| Upload | multer + sharp |
| Validação | Zod |
| Testes | Vitest + Supertest |
| Documentação | Swagger UI |
| Infraestrutura | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Links

- 🔗 API: https://temnobar-api-production.up.railway.app/
- 📘 Documentação: https://temnobar-api-production.up.railway.app/docs/

---

## Início Rápido

### Com Docker (recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/temnobar-api.git
cd temnobar-api

# Configure as variáveis de ambiente
cp .env.example .env

# Suba tudo com um comando
docker compose up -d

# A API estará disponível em http://localhost:3333
# A documentação Swagger em http://localhost:3333/docs
```

### Sem Docker

```bash
# Instale as dependências
npm install

# Configure o .env com sua conexão PostgreSQL
cp .env.example .env

# Gere o client Prisma e aplique as migrations
npx prisma generate
npx prisma db push

# (Opcional) Popule o banco com dados de exemplo
npx prisma db seed

# Inicie o servidor
npm run dev
```

### Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://postgres:postgres@localhost:5432/temnobar` |
| `JWT_SECRET` | Chave secreta para tokens JWT (mín. 32 caracteres) | `sua-chave-secreta-com-pelo-menos-32-caracteres` |
| `PORT` | Porta do servidor | `3333` |
| `NODE_ENV` | Ambiente de execução | `development` \| `production` \| `test` |
| `API_URL` | URL base da API | `http://localhost:3333` |

---

## Arquitetura

```
temnobar-api/
├── modules/             # Módulos de domínio (a lógica mora aqui)
│   ├── auth/            #   Registro, login e sessão
│   ├── bar/             #   Cadastro de bares
│   ├── product/         #   CRUD completo de produtos
│   └── upload/          #   Upload e processamento de imagens
├── middleware/           # Error handler e validação de requests
├── lib/                 # Utilitários (env, erros, IDs)
├── database/            # Configuração do Prisma Client
├── prisma/              # Schema, migrations e seed
├── docs/                # Configuração do Swagger
├── tests/               # Testes de integração
└── .github/workflows/   # Pipeline CI/CD
```

Cada módulo segue uma estrutura consistente:

```
modules/exemplo/
├── exemplo.routes.ts    # Definição de rotas e documentação Swagger
├── exemplo.service.ts   # Lógica de negócio e acesso ao banco
└── exemplo.schema.ts    # Schemas de validação com Zod
```

---

## Endpoints

### Autenticação

| Método | Rota | Autenticação | Descrição |
|--------|------|:------------:|-----------|
| `POST` | `/api/v1/auth/register` | — | Cria uma nova conta |
| `POST` | `/api/v1/auth/login` | — | Realiza login e retorna token JWT |
| `GET` | `/api/v1/auth/me` | Bearer | Retorna o perfil do usuário autenticado |

### Bares

| Método | Rota | Autenticação | Descrição |
|--------|------|:------------:|-----------|
| `GET` | `/api/v1/bars` | — | Lista todos os bares |
| `POST` | `/api/v1/bars` | Bearer | Cadastra um novo bar |

### Produtos

| Método | Rota | Autenticação | Descrição |
|--------|------|:------------:|-----------|
| `POST` | `/api/v1/products` | Bearer | Cadastra um produto |
| `GET` | `/api/v1/products` | — | Lista produtos (com paginação, filtro e busca) |
| `GET` | `/api/v1/products/:id` | — | Retorna um produto específico |
| `PUT` | `/api/v1/products/:id` | Bearer | Atualiza um produto |
| `DELETE` | `/api/v1/products/:id` | Bearer | Remove um produto |

### Upload

| Método | Rota | Autenticação | Descrição |
|--------|------|:------------:|-----------|
| `POST` | `/api/v1/upload/image` | Bearer | Faz upload de imagem com otimização automática |

### Utilitários

| Método | Rota | Autenticação | Descrição |
|--------|------|:------------:|-----------|
| `GET` | `/api/v1/health` | — | Health check |
| `GET` | `/docs` | — | Documentação interativa Swagger UI |

---

## Funcionalidades em Detalhe

### Autenticação & Segurança

- Senhas protegidas com **bcrypt** (10 salt rounds) — nunca armazenadas em texto puro
- Tokens **JWT** com validade de 7 dias
- Middleware de autenticação reutilizável para proteger rotas
- Validação de todas as entradas com **Zod** antes de chegar à lógica de negócio

### Gerenciamento de Produtos

- CRUD completo com suporte a **paginação** (`page`, `per_page`)
- **Filtro por status** (ACTIVE/INACTIVE) para controlar disponibilidade
- **Busca por descrição** com correspondência parcial case-insensitive
- **Filtro por bar** para consultas específicas de um estabelecimento
- Constraint de unicidade por `codigo_produto` dentro de cada bar

### Upload de Imagens

- Conversão automática para WebP
- Geração de thumbnails otimizados (300px)
- Resize inteligente preservando proporção
- Limite de 5MB por arquivo
- Armazenamento local com serving estático via Express

### Multi-bar

- Cada bar possui um **slug único** para identificação amigável
- Produtos são vinculados a bares com integridade referencial
- Consultas podem ser filtradas por `bar_id`

### Tratamento de Erros

Respostas de erro consistentes e padronizadas:

| Código | Situação |
|--------|----------|
| `VALIDATION_ERROR` | Dados de entrada inválidos |
| `NOT_FOUND` | Recurso não encontrado |
| `CONFLICT` | Violação de unicidade (e-mail, slug, código de produto duplicado) |
| `UNAUTHORIZED` | Token ausente ou inválido |
| `INTERNAL_ERROR` | Erro inesperado do servidor |

---

## Banco de Dados

### Modelos

```
┌──────────┐       ┌──────────────┐
│   User   │       │     Bar      │
├──────────┤       ├──────────────┤
│ id       │       │ id           │
│ email    │       │ nome         │
│ name     │  ┌───>│ slug (único) │
│ password │  │    └──────┬───────┘
│ bar_id?──┼──┘           │ 1:N
└──────────┘       ┌──────┴───────┐
                   │   Product    │
                   ├──────────────┤
                   │ id           │
                   │ codigo       │
                   │ descricao    │
                   │ status       │
                   │ foto         │
                   │ thumb        │
                   │ bar_id (FK)  │
                   └──────────────┘
```

### Seed

O seed inclui **22 produtos de exemplo** distribuídos em categorias típicas de bar:

- **Cervejas** — IPA, Lager, Pilsen, Weiss, Stout
- **Drinks** — Caipirinha, Gin Tônica, Moscow Mule, Negroni, Aperol Spritz
- **Sem álcool** — Água, Refrigerante, Coca-Cola, Guaraná, Suco
- **Petiscos** — Batata Frita, Calabresa, Frango, Hambúrguer, Pastéis

---

## Testes

```bash
# Execute os testes
npm test
```

A suíte de testes cobre **todos os endpoints** com testes de integração reais:

- **34 testes** distribuídos em 4 arquivos
- Banco de dados de teste isolado (`temnobar_test`)
- Limpeza automática entre testes para garantir independência
- Helpers reutilizáveis para autenticação e criação de fixtures

| Arquivo | Cobertura |
|---------|-----------|
| `auth.test.ts` | Registro, login, perfil, validações e erros |
| `product.test.ts` | CRUD, paginação, filtros, busca e autenticação |
| `bar.test.ts` | Criação, listagem, validação de slug |
| `upload.test.ts` | Upload, dimensões, formato WebP, rejeições |

---

## CI/CD

O pipeline no **GitHub Actions** roda automaticamente em pushes e PRs para `main`:

1. Type check (TypeScript)
2. Testes de integração com PostgreSQL
3. Prisma generate + schema validation
4. Build de produção

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor em modo desenvolvimento |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm test` | Roda os testes |
| `npm run lint` | Verifica o código com ESLint |

---

## Licença

Este projeto é de uso pessoal. Consulte o autor para permissões de uso.
