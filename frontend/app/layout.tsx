import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://droitguineen.gn"),
  title: {
    default: "Droitguinéen - Portail du Droit Guinéen",
    template: "%s | Droitguinéen",
  },
  description: "Portail officiel du droit guinéen : Lois, Décrets, Ordonnances, Arrêtés et Journal Officiel de la République de Guinée. Accédez facilement à l'ensemble des textes juridiques guinéens.",
  keywords: ["Guinée", "droit", "lois", "décrets", "ordonnances", "journal officiel", "code civil", "code pénal", "législation", "réglementation"],
  authors: [{ name: "Droitguinéen" }],
  creator: "Droitguinéen",
  publisher: "République de Guinée",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_GN",
    url: "https://droitguineen.gn",
    siteName: "Droitguinéen",
    title: "Droitguinéen - Portail du Droit Guinéen",
    description: "Accédez facilement aux lois, décrets et au Journal Officiel de la République de Guinée.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Droitguinéen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Droitguinéen - Portail du Droit Guinéen",
    description: "Accédez facilement aux lois, décrets et au Journal Officiel de la République de Guinée.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} antialiased font-sans bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
