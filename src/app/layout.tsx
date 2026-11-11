import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SplashScreen from "@/components/ui/SplashScreen";
import WhatsAppFloatingBtn from "@/components/ui/WhatsAppFloatingBtn";
import { SHOP_CONFIG } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0f0f12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: {
    default: "Patel car'spa & Detailing | Luxury Auto Spa in Gurugram",
    template: "%s | Patel car'spa & Detailing",
  },
  description:
    "Patel car'spa & Detailing — Gurugram's premier luxury auto spa & detailing studio. High-pressure snow foam baths, interior steam sanitization, 9H nano-ceramic coating, and paint correction with guaranteed customer satisfaction.",
  keywords: [
    "Patel car'spa & Detailing",
    "car wash gurugram",
    "luxury car detailing",
    "ceramic coating",
    "paint correction",
    "foam wash",
    "interior steam clean",
    "bike wash",
    "auto spa gurugram",
  ],
  authors: [{ name: "Patel car'spa & Detailing" }],
  creator: "Patel car'spa & Detailing",
  publisher: "Patel car'spa & Detailing",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Patel car'spa & Detailing",
    title: "Patel car'spa & Detailing | Luxury Auto Spa in Gurugram",
    description:
      "Experience showroom-grade paint correction, hydrophobic snow foam baths, and ceramic protection at Patel car'spa & Detailing in Gurugram.",
    images: [
      {
        url: "/logo/logo.png",
        width: 512,
        height: 512,
        alt: "Patel car'spa & Detailing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Patel car'spa & Detailing | Luxury Auto Spa in Gurugram",
    description:
      "Patel car'spa & Detailing — Gurugram's premier luxury auto spa & detailing studio. Snow foam wash, steam cleaning & ceramic coating.",
    images: ["/logo/logo.png"],
  },
  manifest: "/manifest.json",
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
        className={`${inter.variable} ${poppins.variable} font-sans bg-charcoal-900 text-gray-100 antialiased w-full min-h-screen overflow-x-hidden flex flex-col justify-between selection:bg-neon-blue/30 selection:text-neon-blue`}
      >
        <AuthProvider>
          {/* Animated Splash Screen with bubble/foam simulation (sessionStorage guarded) */}
          <SplashScreen />

          {/* Sticky Glassmorphic Header */}
          <Header />

          {/* Main Page Content */}
          <main className="w-full flex-grow relative z-10">{children}</main>

          {/* Floating WhatsApp Quick Action Button */}
          <WhatsAppFloatingBtn />

          {/* Pure Black Client Footer (#000000) */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
