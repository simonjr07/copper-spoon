ALTER TABLE "Order"
ADD COLUMN "checkoutToken" VARCHAR(64);

ALTER TABLE "Order"
ADD CONSTRAINT "Order_checkoutToken_format_check"
CHECK (
    "checkoutToken" IS NULL
    OR "checkoutToken" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

CREATE UNIQUE INDEX "Order_checkoutToken_key" ON "Order"("checkoutToken");
