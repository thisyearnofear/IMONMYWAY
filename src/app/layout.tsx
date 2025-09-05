import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";

export const metadata: Metadata = {
  title: "Punctuality Protocol - Decentralized Betting on Punctuality",
  description:
    "Put your money where your mouth is. Stake tokens on punctuality commitments and let others bet on your success with real-time GPS verification.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
