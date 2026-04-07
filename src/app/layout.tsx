import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Amazon Sales Intelligence — BSR Analytics Platform",
  description:
    "Track Amazon Best Seller Rank across all categories. Estimate monthly sales, revenue, and trends with category-calibrated logarithmic models. Production-grade alternative to Helium 10.",
  keywords: [
    "Amazon",
    "BSR",
    "Best Seller Rank",
    "Sales Estimation",
    "Helium 10",
    "Product Research",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f1117] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
