import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PropInspect AI — AI-Powered Property Inspection Platform",
  description:
    "Automated property inventory & inspection using computer vision, YOLO object detection, ByteTrack tracking, SAM2 segmentation, and Qwen2.5-VL multimodal reasoning.",
  keywords: [
    "property inspection",
    "AI inventory",
    "real estate",
    "computer vision",
    "YOLO detection",
    "damage detection",
  ],
  authors: [{ name: "PropInspect AI" }],
  openGraph: {
    title: "PropInspect AI",
    description: "AI-Powered Property Inspection Platform",
    type: "website",
    siteName: "PropInspect AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "PropInspect AI",
    description: "AI-Powered Property Inspection Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
