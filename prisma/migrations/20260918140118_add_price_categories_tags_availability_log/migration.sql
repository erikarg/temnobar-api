-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "preco" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "bar_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_availability_logs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "bar_id" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_availability_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_bar_id_ordem_idx" ON "categories"("bar_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "categories_bar_id_slug_key" ON "categories"("bar_id", "slug");

-- CreateIndex
CREATE INDEX "product_availability_logs_product_id_created_at_idx" ON "product_availability_logs"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "product_availability_logs_bar_id_created_at_idx" ON "product_availability_logs"("bar_id", "created_at");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_availability_logs" ADD CONSTRAINT "product_availability_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
