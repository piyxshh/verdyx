import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verdyx — Predictive Enterprise Decision Intelligence",
  description: "ML-powered multi-agent financial distress prediction and strategic decision intelligence platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
