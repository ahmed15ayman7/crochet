import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Education & Commerce API",
  description:
    "Backend API for educational video content, product catalog, and order management. Built with Next.js, Prisma, MongoDB, JWT auth, and OpenAPI documentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 antialiased`}
      >
        <header className="border-b border-zinc-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Backend platform
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
                Education &amp; commerce API
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
                REST API for learning courses (videos and descriptions), an
                e-commerce product catalog, and user orders with a simulated
                checkout flow. Authentication uses JWT; admin routes protect
                catalog and course management. Explore endpoints in the bundled
                OpenAPI / Swagger UI.
              </p>
            </div>
            <nav className="flex shrink-0 flex-wrap gap-3 sm:pt-1">
              <Link
                href="/api-docs"
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                API documentation
              </Link>
              <Link
                href="/openapi.json"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                OpenAPI JSON
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
