import type { Metadata, Viewport } from "next";
import { Inter, Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SplashScreen from "@/components/ui/SplashScreen";
import WhatsAppFloatingBtn from "@/components/ui/WhatsAppFloatingBtn";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0B0B0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: {
    default: "Patel car'spa & Detailing | Auto Spa & Detailing Studio",
    template: "%s | Patel car'spa & Detailing",
  },
  description:
    "Patel car'spa & Detailing — Auto spa & detailing studio in Rankuva, Gujarat. High-pressure snow foam baths, interior steam extraction, paint correction & 9H ceramic coating.",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable} font-sans bg-noir-900 text-noir-100 antialiased w-full min-h-screen overflow-x-hidden flex flex-col justify-between selection:bg-accent-cyan/20 selection:text-accent-cyan`}
      >
        <AuthProvider>
          <SplashScreen />
          <Header />
          <main className="w-full flex-grow relative z-10">{children}</main>
          <WhatsAppFloatingBtn />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
