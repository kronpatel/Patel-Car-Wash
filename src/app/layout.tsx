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
    default: "Patel Car'spa & Detailing Studio | Luxury Auto Spa in Gujarat",
    template: "%s | Patel Car'spa & Detailing Studio",
  },
  description:
    "Patel Car'spa & Detailing Studio — Gujarat's premier luxury auto spa & detailing studio. High-pressure snow foam baths, interior steam sanitization, 9H nano-ceramic coating, and paint correction with guaranteed customer satisfaction.",
  keywords: [
    "Patel Car'spa & Detailing Studio",
    "car wash gujarat",
    "luxury car detailing",
    "ceramic coating",
    "paint correction",
    "foam wash",
    "interior steam clean",
    "bike wash",
    "auto spa gujarat",
  ],
  authors: [{ name: "Patel Car'spa & Detailing Studio" }],
  creator: "Patel Car'spa & Detailing Studio",
  publisher: "Patel Car'spa & Detailing Studio",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Patel Car'spa & Detailing Studio",
    title: "Patel Car'spa & Detailing Studio | Luxury Auto Spa in Gujarat",
    description:
      "Experience showroom-grade paint correction, hydrophobic snow foam baths, and ceramic protection at Patel Car'spa & Detailing Studio in Gujarat.",
    images: [
      {
        url: "/logo/logo.svg",
        width: 512,
        height: 512,
        alt: "Patel Car'spa & Detailing Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Patel Car'spa & Detailing Studio | Luxury Auto Spa in Gujarat",
    description:
      "Patel Car'spa & Detailing Studio — Gujarat's premier luxury auto spa & detailing studio. Snow foam wash, steam cleaning & ceramic coating.",
    images: ["/logo/logo.svg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-192x192.svg",
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
          <main className="w-full flex-grow relative">{children}</main>

          {/* Floating WhatsApp Quick Action Button */}
          <WhatsAppFloatingBtn />

          {/* Pure Black Client Footer (#000000) */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
