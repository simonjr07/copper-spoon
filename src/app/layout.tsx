import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CartProvider } from "@/features/cart/cart-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Copper Spoon | Modern comfort food",
  description: "Browse, customize, and place a fictional pickup or delivery order from Copper Spoon's modern comfort-food menu.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
