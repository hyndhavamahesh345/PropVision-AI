import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#030712",
          colorInputBackground: "rgba(255, 255, 255, 0.05)",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#9ca3af",
          borderRadius: "0.75rem",
        },
        elements: {
          formButtonPrimary: 
            "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg",
          card: "bg-gray-900 border border-white/10 shadow-2xl",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton: 
            "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
          formFieldLabel: "text-gray-300",
          formFieldInput: 
            "bg-white/5 border border-white/10 text-white focus:border-indigo-500",
          footerActionLink: "text-indigo-400 hover:text-indigo-300",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-indigo-400",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
