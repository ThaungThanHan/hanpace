import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pace - walking club",
  description: "A single-page walking club landing page.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
