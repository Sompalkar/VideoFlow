"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData.email, formData.password);
      router.push("/dashboard");
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-900 lg:grid lg:grid-cols-2">
      {/* ===== Brand panel ===== */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-teal-900 text-white p-12 xl:p-16">
        <div className="absolute inset-0 lp-dots-light" aria-hidden />
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-yellow-400/20 blur-3xl" aria-hidden />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center">
            <Play className="w-4 h-4 text-stone-900 fill-stone-900 ml-0.5" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">videoflow</span>
        </Link>

        <div className="relative">
          <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight text-balance">
            Welcome back to the calm side of{" "}
            <span className="italic text-yellow-300">publishing.</span>
          </h2>
          <p className="mt-6 text-lg text-teal-100/90 max-w-md leading-relaxed">
            Review, approve, and ship your team's videos to YouTube—without ever sharing your password.
          </p>

          <div className="mt-10 rounded-2xl bg-white/8 border border-white/12 p-6 backdrop-blur max-w-md">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="font-display italic text-[17px] text-teal-50 leading-relaxed">
              "Editors upload drafts, I approve on my phone, and they go live. Effortless."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-yellow-400 text-stone-900 flex items-center justify-center font-bold text-sm">
                SC
              </div>
              <div className="text-sm">
                <div className="font-semibold">Sarah Chen</div>
                <div className="text-teal-200/80">Tech Creator · 2.5M subs</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-teal-100/80">
          <ShieldCheck className="w-4 h-4 text-yellow-400" />
          Your YouTube password is never shared
        </div>
      </aside>

      {/* ===== Form panel ===== */}
      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 lp-dots opacity-70 lg:hidden" aria-hidden />
        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex justify-center mb-8">
            <div className="relative w-40 h-11">
              <Image src="/image.png" alt="VideoFlow" fill className="object-contain" priority />
            </div>
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-stone-900">Sign in</h1>
            <p className="mt-2 text-stone-600">
              New here?{" "}
              <Link href="/auth/register" className="font-semibold text-teal-700 hover:text-teal-800 underline-offset-4 hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-stone-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@channel.com"
                required
                disabled={isLoading}
                className="h-12 rounded-xl bg-white border-stone-300 focus-visible:border-teal-600 focus-visible:ring-teal-600/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-stone-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-white border-stone-300 focus-visible:border-teal-600 focus-visible:ring-teal-600/30 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-3.5 hover:bg-transparent text-stone-400 hover:text-stone-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="data-[state=checked]:bg-teal-700 data-[state=checked]:border-teal-700"
                />
                <Label htmlFor="remember" className="text-sm text-stone-600 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm font-medium text-teal-700 hover:text-teal-800">
                Forgot password?
              </Link>
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="group w-full h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-full font-semibold shadow-lg shadow-teal-900/15 transition-all hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-10">
            <Link href="/" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
