import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fruitverse — The Sakura Sanctuary",
  description: "Wander through a cinematic Japanese fairyland. Drifting blossoms, glowing lanterns, and a little wonder around every corner.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
