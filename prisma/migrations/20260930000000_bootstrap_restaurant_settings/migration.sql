-- A clean production database needs the singleton operational configuration,
-- but must not depend on the development catalog seed.
INSERT INTO "RestaurantSettings" (
    "id",
    "restaurantName",
    "currency",
    "timezone",
    "pickupEnabled",
    "deliveryEnabled",
    "payOnPickupEnabled",
    "payOnDeliveryEnabled",
    "demoCardEnabled",
    "deliveryFeeCents",
    "minimumDeliveryOrderCents",
    "createdAt",
    "updatedAt"
)
VALUES (
    'restaurant-settings',
    'Copper Spoon',
    'USD',
    'America/New_York',
    true,
    true,
    true,
    true,
    true,
    0,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
