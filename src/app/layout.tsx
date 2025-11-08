import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedLayout } from "@/components/auth/protected-layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Rob Air - Your Flight Companion",
  description: "Track flights, manage maintenance, and get AI-powered insights for your aircraft.",
  keywords: "flight tracking, aircraft maintenance, aviation, Rob Air",
  authors: [{ name: "Rob Air" }],
  openGraph: {
    title: "Rob Air - Your Flight Companion",
    description: "Track flights, manage maintenance, and get AI-powered insights for your aircraft.",
    url: "https://robair.xyz",
    siteName: "Rob Air",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rob Air - Your Flight Companion",
    description: "Track flights, manage maintenance, and get AI-powered insights for your aircraft.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
