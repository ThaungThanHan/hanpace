import type { Metadata } from "next";
import type { ReactNode } from "react";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard | Han Fitness",
  description: "Han Fitness Dashboard.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-dvh bg-white md:grid md:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[242px_minmax(0,1fr)]">
          <Sidebar />
          <main className="min-w-0 px-[18px] py-[30px] md:px-[25px] md:py-8 lg:px-[42px] lg:py-[38px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
