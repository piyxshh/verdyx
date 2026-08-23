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
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#070a12] text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}
