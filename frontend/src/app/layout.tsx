import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// ThemeProvider is applied to authenticated routes only (see /dashboard/layout.tsx)

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlo",
  description: "Task management app for efficient workflow",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
  lang="en"
  suppressHydrationWarning
  className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
>
      <head />
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
