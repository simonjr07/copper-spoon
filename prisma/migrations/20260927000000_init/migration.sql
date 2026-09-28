-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfilmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAY_ON_PICKUP', 'PAY_ON_DELIVERY', 'DEMO_CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'SIMULATED', 'SETTLED');

-- CreateEnum
CREATE TYPE "OptionSelectionType" AS ENUM ('SINGLE', 'MULTIPLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_email_normalized_check" CHECK ("email" = lower("email"))
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Category_sortOrder_check" CHECK ("sortOrder" >= 0)
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "imageUrl" VARCHAR(2048),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MenuItem_priceCents_check" CHECK ("priceCents" >= 0),
    CONSTRAINT "MenuItem_sortOrder_check" CHECK ("sortOrder" >= 0)
);

-- CreateTable
CREATE TABLE "MenuItemOptionGroup" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "selectionType" "OptionSelectionType" NOT NULL,
    "minSelections" INTEGER NOT NULL DEFAULT 0,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MenuItemOptionGroup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MenuItemOptionGroup_selection_bounds_check" CHECK (
        "minSelections" >= 0
        AND "maxSelections" > 0
        AND "minSelections" <= "maxSelections"
        AND ("selectionType" <> 'SINGLE' OR "maxSelections" = 1)
    ),
    CONSTRAINT "MenuItemOptionGroup_sortOrder_check" CHECK ("sortOrder" >= 0)
);

-- CreateTable
CREATE TABLE "MenuItemOption" (
    "id" TEXT NOT NULL,
    "optionGroupId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "priceAdjustmentCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MenuItemOption_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MenuItemOption_priceAdjustmentCents_check" CHECK ("priceAdjustmentCents" >= 0),
    CONSTRAINT "MenuItemOption_sortOrder_check" CHECK ("sortOrder" >= 0)
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "publicCode" VARCHAR(16) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "fulfilmentType" "FulfilmentType" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "customerName" VARCHAR(120) NOT NULL,
    "customerEmail" VARCHAR(254) NOT NULL,
    "customerPhone" VARCHAR(40) NOT NULL,
    "deliveryAddressLine1" VARCHAR(200),
    "deliveryAddressLine2" VARCHAR(200),
    "deliveryCity" VARCHAR(120),
    "deliveryRegion" VARCHAR(120),
    "deliveryPostalCode" VARCHAR(32),
    "deliveryCountry" CHAR(2),
    "customerNote" VARCHAR(1000),
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "subtotalCents" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "placedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_publicCode_format_check" CHECK ("publicCode" ~ '^CS-[A-Z0-9]{6,12}$'),
    CONSTRAINT "Order_customerEmail_normalized_check" CHECK ("customerEmail" = lower("customerEmail")),
    CONSTRAINT "Order_delivery_address_check" CHECK (
        "fulfilmentType" = 'PICKUP'
        OR (
            "deliveryAddressLine1" IS NOT NULL
            AND "deliveryCity" IS NOT NULL
            AND "deliveryPostalCode" IS NOT NULL
            AND "deliveryCountry" IS NOT NULL
        )
    ),
    CONSTRAINT "Order_payment_fulfilment_check" CHECK (
        "paymentMethod" = 'DEMO_CARD'
        OR ("paymentMethod" = 'PAY_ON_PICKUP' AND "fulfilmentType" = 'PICKUP')
        OR ("paymentMethod" = 'PAY_ON_DELIVERY' AND "fulfilmentType" = 'DELIVERY')
    ),
    CONSTRAINT "Order_totals_check" CHECK (
        "subtotalCents" >= 0
        AND "deliveryFeeCents" >= 0
        AND "totalCents" = "subtotalCents" + "deliveryFeeCents"
        AND ("fulfilmentType" <> 'PICKUP' OR "deliveryFeeCents" = 0)
    )
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "itemNameSnapshot" VARCHAR(120) NOT NULL,
    "unitPriceCentsSnapshot" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "optionsTotalCentsSnapshot" INTEGER NOT NULL DEFAULT 0,
    "lineTotalCents" INTEGER NOT NULL,
    "customerNote" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderItem_snapshot_totals_check" CHECK (
        "unitPriceCentsSnapshot" >= 0
        AND "optionsTotalCentsSnapshot" >= 0
        AND "quantity" > 0
        AND "lineTotalCents" = ("unitPriceCentsSnapshot" + "optionsTotalCentsSnapshot") * "quantity"
    )
);

-- CreateTable
CREATE TABLE "OrderItemOption" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "menuItemOptionId" TEXT,
    "optionGroupNameSnapshot" VARCHAR(120) NOT NULL,
    "optionNameSnapshot" VARCHAR(120) NOT NULL,
    "priceAdjustmentCentsSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItemOption_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderItemOption_priceAdjustmentCentsSnapshot_check" CHECK ("priceAdjustmentCentsSnapshot" >= 0)
);

-- CreateTable
CREATE TABLE "OrderStatusEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "changedByUserId" TEXT,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderStatusEvent_transition_check" CHECK ("fromStatus" IS NULL OR "fromStatus" <> "toStatus")
);

-- CreateTable
CREATE TABLE "RestaurantSettings" (
    "id" VARCHAR(32) NOT NULL,
    "restaurantName" VARCHAR(120) NOT NULL,
    "contactEmail" VARCHAR(254),
    "contactPhone" VARCHAR(40),
    "addressLine1" VARCHAR(200),
    "addressLine2" VARCHAR(200),
    "city" VARCHAR(120),
    "region" VARCHAR(120),
    "postalCode" VARCHAR(32),
    "country" CHAR(2),
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/New_York',
    "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "payOnPickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "payOnDeliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "demoCardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
    "minimumDeliveryOrderCents" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RestaurantSettings_singleton_check" CHECK ("id" = 'restaurant-settings'),
    CONSTRAINT "RestaurantSettings_contactEmail_normalized_check" CHECK ("contactEmail" IS NULL OR "contactEmail" = lower("contactEmail")),
    CONSTRAINT "RestaurantSettings_delivery_amounts_check" CHECK (
        "deliveryFeeCents" >= 0
        AND ("minimumDeliveryOrderCents" IS NULL OR "minimumDeliveryOrderCents" >= 0)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_status_role_idx" ON "User"("status", "role");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_isPublished_sortOrder_idx" ON "Category"("isPublished", "sortOrder");
CREATE UNIQUE INDEX "MenuItem_slug_key" ON "MenuItem"("slug");
CREATE INDEX "MenuItem_categoryId_isPublished_isAvailable_sortOrder_idx" ON "MenuItem"("categoryId", "isPublished", "isAvailable", "sortOrder");
CREATE INDEX "MenuItem_isArchived_idx" ON "MenuItem"("isArchived");
CREATE INDEX "MenuItemOptionGroup_menuItemId_isActive_sortOrder_idx" ON "MenuItemOptionGroup"("menuItemId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "MenuItemOptionGroup_menuItemId_name_key" ON "MenuItemOptionGroup"("menuItemId", "name");
CREATE INDEX "MenuItemOption_optionGroupId_isAvailable_sortOrder_idx" ON "MenuItemOption"("optionGroupId", "isAvailable", "sortOrder");
CREATE UNIQUE INDEX "MenuItemOption_optionGroupId_name_key" ON "MenuItemOption"("optionGroupId", "name");
CREATE UNIQUE INDEX "Order_publicCode_key" ON "Order"("publicCode");
CREATE INDEX "Order_status_placedAt_idx" ON "Order"("status", "placedAt" DESC);
CREATE INDEX "Order_placedAt_idx" ON "Order"("placedAt" DESC);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");
CREATE INDEX "OrderItemOption_orderItemId_idx" ON "OrderItemOption"("orderItemId");
CREATE INDEX "OrderItemOption_menuItemOptionId_idx" ON "OrderItemOption"("menuItemOptionId");
CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx" ON "OrderStatusEvent"("orderId", "createdAt");
CREATE INDEX "OrderStatusEvent_changedByUserId_idx" ON "OrderStatusEvent"("changedByUserId");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MenuItemOptionGroup" ADD CONSTRAINT "MenuItemOptionGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItemOption" ADD CONSTRAINT "MenuItemOption_optionGroupId_fkey" FOREIGN KEY ("optionGroupId") REFERENCES "MenuItemOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItemOption" ADD CONSTRAINT "OrderItemOption_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItemOption" ADD CONSTRAINT "OrderItemOption_menuItemOptionId_fkey" FOREIGN KEY ("menuItemOptionId") REFERENCES "MenuItemOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
