import type { Metadata } from "next";

import { PublicHeader } from "@/components/public-header";
import { CartPageContent } from "@/features/cart/cart-page";
import { privateRouteRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Cart | Copper Spoon",
  description: "Review your configured Copper Spoon menu items and estimated subtotal.",
  robots: privateRouteRobots,
};

export default function CartPage() {
  return (
    <>
      <PublicHeader />
      <CartPageContent />
    </>
  );
}
