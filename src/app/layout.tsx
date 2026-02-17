import type { Metadata } from "next";
import "./globals.css";
import ToastViewport from "./components/ToastViewport";

export const metadata: Metadata = {
  title: "TurnKey | AI-powered ordering for modern distributors",
  description:
    "Mobile-first ordering platform for distributors with AI suggestions, deposits, and operations dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
