import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Gadaa Code — Living Distributed Network",
  description: "A speculative Decentralized Justice Protocol based on 500 years of Oromo Gadaa governance. Trust is built through participation.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gadaa-bg text-gadaa-cream antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
