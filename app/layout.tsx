import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Jalal Grini — AI & Software Engineer",
  description:
    "AI, data and software engineering. Explore the work of Jalal Grini, or take a walk through his pixel-art career town.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
