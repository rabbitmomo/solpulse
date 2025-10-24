import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { WalletContextProvider } from "./providers/WalletContextProvider";

export const metadata: Metadata = {
  title: "SolPulse - Meme Coin Sentiment Aggregator",
  description: "Real-time on-chain sentiment aggregator for meme coin predictions. Vote, stake, and earn on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
