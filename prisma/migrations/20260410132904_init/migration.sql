-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "bars" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "codigo_produto" TEXT NOT NULL,
    "descricao_produto" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "foto_produto" TEXT,
    "thumb_produto" TEXT,
    "bar_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bar_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bars_slug_key" ON "bars"("slug");

-- CreateIndex
CREATE INDEX "products_bar_id_status_idx" ON "products"("bar_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "products_bar_id_codigo_produto_key" ON "products"("bar_id", "codigo_produto");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
