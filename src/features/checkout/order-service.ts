import {
  CheckoutError,
  prepareAuthoritativeOrder,
  type CheckoutCatalogItem,
  type CheckoutInput,
  type CheckoutSettings,
  type PreparedOrder,
} from "@/features/checkout/checkout";

const PUBLIC_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const PUBLIC_CODE_LENGTH = 10;
const MAX_TRANSACTION_ATTEMPTS = 4;
export const PUBLIC_ORDER_CODE_PATTERN = /^CS-[A-Z0-9]{6,12}$/;

export type OrderCreationTransaction = {
  findOrderByCheckoutToken(checkoutToken: string): Promise<{ publicCode: string } | null>;
  getSettings(): Promise<CheckoutSettings | null>;
  getCatalogItems(ids: string[]): Promise<CheckoutCatalogItem[]>;
  createOrder(prepared: PreparedOrder, publicCode: string): Promise<{ publicCode: string }>;
};

export type OrderCreationRepository = {
  transaction<T>(work: (transaction: OrderCreationTransaction) => Promise<T>): Promise<T>;
};

export async function createAuthoritativeOrder(
  input: CheckoutInput,
  repository: OrderCreationRepository,
  generateCode: () => string = generatePublicOrderCode,
) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await repository.transaction(async (transaction) => {
        const existingOrder = await transaction.findOrderByCheckoutToken(
          input.submissionToken,
        );

        if (existingOrder) {
          return existingOrder;
        }

        const settings = await transaction.getSettings();

        if (!settings) {
          throw new CheckoutError(
            "ORDERING_UNAVAILABLE",
            "Online ordering is temporarily unavailable.",
          );
        }

        const itemIds = [...new Set(input.cart.map((line) => line.menuItemId))];
        const catalogItems = await transaction.getCatalogItems(itemIds);
        const prepared = prepareAuthoritativeOrder(input, settings, catalogItems);

        return transaction.createOrder(prepared, generateCode());
      });
    } catch (error) {
      if (attempt < MAX_TRANSACTION_ATTEMPTS && isRetryableTransactionError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Order creation attempts were exhausted.");
}

export function generatePublicOrderCode(randomValues?: Uint8Array) {
  const values = randomValues ?? crypto.getRandomValues(new Uint8Array(PUBLIC_CODE_LENGTH));

  if (values.length < PUBLIC_CODE_LENGTH) {
    throw new TypeError(`Public order codes require ${PUBLIC_CODE_LENGTH} random bytes.`);
  }

  const suffix = Array.from(values.slice(0, PUBLIC_CODE_LENGTH), (value) =>
    PUBLIC_CODE_ALPHABET.at(value % PUBLIC_CODE_ALPHABET.length),
  ).join("");

  return `CS-${suffix}`;
}

function isRetryableTransactionError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return error.code === "P2002" || error.code === "P2034";
}
