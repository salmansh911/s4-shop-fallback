import type { Metadata } from "next";
import "./globals.css";
import ToastViewport from "./components/ToastViewport";

export const metadata: Metadata = {
  title: "Commerce | Ramadan ordering platform",
  description:
    "Mobile-first ordering platform for restaurant and wholesale Ramadan supply ordering.",
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
