import type { Metadata } from "next";
import { GeistMono } from 'geist/font/mono'
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-regular antialiased h-screen ${GeistMono.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
