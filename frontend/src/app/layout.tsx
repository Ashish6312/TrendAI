import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import ScrollToTop from "@/components/ScrollToTop";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "TrendAI | AI-Powered Business Intelligence",
  description: "Using AI to analyze global trends and community feedback to help you build successful businesses.",
};

import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased min-h-screen flex flex-col scroll-smooth`}>
        <div className="bg-glow" />
        <ClientProviders>
          <GlobalErrorBoundary>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <ScrollToTop />
          </GlobalErrorBoundary>
        </ClientProviders>
      </body>
    </html>
  );
}
