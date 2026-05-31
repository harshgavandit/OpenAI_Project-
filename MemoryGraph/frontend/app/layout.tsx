import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { QueryProvider } from "./providers/QueryProvider";
import { ApiHealthBanner } from "./components/ApiHealthBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  title: 'MemoryGraph — Family memories with sources you can trust',
  description:
    'Ask your family memories anything and see where every answer came from. Private AI on your machine. Build and share life stories.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'MemoryGraph',
    description: 'Ask family memories anything — every answer shows its sources.',
    url: '/',
    siteName: 'MemoryGraph',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MemoryGraph',
    description: 'Ask family memories anything — every answer shows its sources.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ApiHealthBanner />
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <QueryProvider>
              <AuthProvider>{children}</AuthProvider>
            </QueryProvider>
          </GoogleOAuthProvider>
        ) : (
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        )}
      </body>
    </html>
  );
}
