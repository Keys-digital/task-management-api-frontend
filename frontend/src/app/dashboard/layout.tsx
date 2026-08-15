import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";

// Geist font variables are applied on the root <html> in app/layout.tsx.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <>
            <div>
        <ThemeProvider>{children}</ThemeProvider>
      </div>
    </>
  );
}
