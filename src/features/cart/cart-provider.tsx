"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import {
  CART_STORAGE_KEY,
  cartReducer,
  deserializeCart,
  emptyCartState,
  getCartItemCount,
  serializeCart,
  type CartAction,
  type CartLine,
  type CartState,
} from "@/features/cart/cart";

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  isHydrated: boolean;
  addLine(line: CartLine): void;
  setQuantity(lineId: string, quantity: number): void;
  removeLine(lineId: string): void;
  clearCart(): void;
};

const CartContext = createContext<CartContextValue | null>(null);

type ProviderState = {
  cart: CartState;
  isHydrated: boolean;
};

function providerReducer(state: ProviderState, action: CartAction): ProviderState {
  if (action.type === "hydrate") {
    return { cart: action.state, isHydrated: true };
  }

  return {
    cart: cartReducer(state.cart, action),
    isHydrated: state.isHydrated,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(providerReducer, {
    cart: emptyCartState,
    isHydrated: false,
  });

  useEffect(() => {
    let restored = emptyCartState;

    try {
      restored = deserializeCart(window.localStorage.getItem(CART_STORAGE_KEY));
    } catch {
      // Storage can be blocked by browser privacy settings; an in-memory cart still works.
    }

    dispatch({ type: "hydrate", state: restored });
  }, []);

  useEffect(() => {
    if (!state.isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(state.cart));
    } catch {
      // Quota/privacy failures should not break the current in-memory cart.
    }
  }, [state]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.cart.lines,
      itemCount: getCartItemCount(state.cart),
      isHydrated: state.isHydrated,
      addLine(line) {
        dispatch({ type: "add", line });
      },
      setQuantity(lineId, quantity) {
        dispatch({ type: "set-quantity", lineId, quantity });
      },
      removeLine(lineId) {
        dispatch({ type: "remove", lineId });
      },
      clearCart() {
        dispatch({ type: "clear" });
      },
    }),
    [state],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
