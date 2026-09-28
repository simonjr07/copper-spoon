import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CartProvider } from "@/features/cart/cart-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Copper Spoon",
  description: "A modern restaurant ordering experience.",
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
