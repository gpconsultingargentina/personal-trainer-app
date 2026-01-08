import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Trainer - Gestión de Clases",
  description: "Sistema de gestión de clases para personal trainer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

