import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MainNav } from "@/components/main-nav"
import { DashboardNav } from "@/components/dashboard-nav"
import { AuthProvider } from "@/components/auth-provider"

// Fix Node 25 experimental localStorage crash
if (typeof globalThis !== "undefined" && globalThis.localStorage) {
  delete (globalThis as any).localStorage;
}

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VideoFlow - Video Management Platform",
  description: "Streamline your video workflow from upload to YouTube publishing",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
