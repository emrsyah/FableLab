import type { Metadata } from "next";
import "./globals.css";
import { AgentationWrapper } from "@/components/agentation-wrapper";
import { TRPCProvider } from "@/lib/trpc/client";

export const metadata: Metadata = {
  title: "FableLab AI",
  description: "K12 STEM Learning AI Playground",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCProvider>
      <html lang="en">
        <head>
          <link
            href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,301,701,300,501,401,901,400&display=swap"
            rel="stylesheet"
          />
        </head>
        <body suppressHydrationWarning className="antialiased font-sans">
          {children}
          <AgentationWrapper />
        </body>
      </html>
    </TRPCProvider>
  );
}
