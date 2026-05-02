-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "activity_categories" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_items" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factors" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "source" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "occurredAt" DATE NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "memo" TEXT,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_categories_code_key" ON "activity_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "activity_items_code_key" ON "activity_items"("code");

-- CreateIndex
CREATE INDEX "activity_items_categoryId_idx" ON "activity_items"("categoryId");

-- CreateIndex
CREATE INDEX "emission_factors_itemId_validFrom_idx" ON "emission_factors"("itemId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "emission_factors_itemId_version_key" ON "emission_factors"("itemId", "version");

-- CreateIndex
CREATE INDEX "activities_occurredAt_idx" ON "activities"("occurredAt");

-- CreateIndex
CREATE INDEX "activities_itemId_occurredAt_idx" ON "activities"("itemId", "occurredAt");

-- CreateIndex
CREATE INDEX "import_batches_createdAt_idx" ON "import_batches"("createdAt");

-- AddForeignKey
ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "activity_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_factors" ADD CONSTRAINT "emission_factors_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "activity_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "activity_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
