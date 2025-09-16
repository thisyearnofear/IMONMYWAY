import type { Metadata } from "next";
import "./globals.css";
import { SmartNotificationCenter } from '@/components/smart/SmartNotificationCenter'
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
import { GlobalErrorBoundary } from '@/components/core/GlobalErrorBoundary';
import ThreeBackground from "@/components/three/ThreeBackground";

export const metadata: Metadata = {
  title: "IMONMYWAY - Punctuality Protocol on Somnia",
  description:
    "Put your money where your mouth is. Stake tokens on punctuality commitments and let others bet on your success with real-time GPS verification on Somnia Network.",
  icons: {
    icon: '/IOMYfavicon.ico',
    apple: '/IOMYsquare.png',
  },
  openGraph: {
    title: "IMONMYWAY - Punctuality Protocol",
    description: "First punctuality accountability protocol on Somnia Network",
    images: ['/IOMYbanner.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
        <ThreeBackground />
        <GlobalErrorBoundary enableRecovery={true} showErrorDetails={process.env.NODE_ENV === 'development'}>
          <PremiumNavigation />
          {children}
          <SmartNotificationCenter />
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
