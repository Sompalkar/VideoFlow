"use client"

import type React from "react"
import { MainNav } from "@/components/main-nav"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isInitialized } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/auth/login")
    }
  }, [user, isInitialized, router])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col">
      <MainNav />
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  )
}
