import type { Metadata } from "next";

import { PublicHeader } from "@/components/public-header";
import { CartPageContent } from "@/features/cart/cart-page";

export const metadata: Metadata = {
  title: "Cart | Copper Spoon",
  description: "Review your configured Copper Spoon menu items and estimated subtotal.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <PublicHeader />
      <CartPageContent />
    </>
  );
}
