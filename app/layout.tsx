import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haqdar — Pakistan's Refund Button",
  description:
    "Detect overcharges in Pakistani utility bills using NEPRA's own 2024 inquiry patterns. Get your money back.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-bg text-text-main antialiased min-h-screen">{children}</body>
    </html>
  );
}
