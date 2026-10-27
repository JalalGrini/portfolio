import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
import "./studio.css";
import "./town.css";
import "./village.css";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('portfolio-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
