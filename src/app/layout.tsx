import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YuNoWellness PH — Peptide Education & Wellness",
  description:
    "Your trusted Filipino resource for peptide education. Learn about peptides, dosing, reconstitution, and wellness — written in plain English for everyone.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
