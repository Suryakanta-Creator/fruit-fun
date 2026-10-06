import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fruitverse — Into the Wild",
  description: "A cinematic, scroll-driven fruit experience inside a living forest.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
