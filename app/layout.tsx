import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "./components/service-worker-register/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Otakufiit - Gestion de Clases",
  description: "Sistema de gestion de clases para personal trainer",
  applicationName: "Otakufiit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Otakufiit",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Otakufiit",
    title: "Otakufiit - Gestion de Clases",
    description: "Sistema de gestion de clases para personal trainer",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
