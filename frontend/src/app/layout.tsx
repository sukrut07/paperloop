import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Paperloop | Blockchain Recycling",
  description: "Educational paper recycling ecosystem on Polygon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow p-6 md:p-12">
            {children}
          </main>
          <footer className="border-t-4 border-black p-8 text-center font-bold uppercase">
            © 2024 Paperloop - Powered by Polygon
          </footer>
        </div>
      </body>
    </html>
  );
}
