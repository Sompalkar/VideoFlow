"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Crown,
  Edit,
  Settings,
  ShieldCheck,
  Sparkles,
  Youtube,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "creator",
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({
    score: 0,
    feedback: [],
  });

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push("At least 8 characters");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("One uppercase letter");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("One lowercase letter");

    if (/\d/.test(password)) score++;
    else feedback.push("One number");

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push("One special character");

    setPasswordStrength({ score, feedback });
  };

  const handlePasswordChange = (password: string) => {
    setFormData((prev) => ({ ...prev, password }));
    checkPasswordStrength(password);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return "bg-red-500";
    if (passwordStrength.score <= 3) return "bg-yellow-400";
    if (passwordStrength.score <= 4) return "bg-teal-400";
    return "bg-teal-600";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return "Weak";
    if (passwordStrength.score <= 3) return "Fair";
    if (passwordStrength.score <= 4) return "Good";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (!acceptTerms) {
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as "creator" | "editor" | "manager",
      });
      router.push("/dashboard");
    } catch (error) {
      // Error is handled by the store
    }
  };

  const roles = [
    {
      value: "creator",
      icon: Crown,
      title: "Creator",
      desc: "Manage your own channel and team",
    },
    {
      value: "editor",
      icon: Edit,
      title: "Editor",
      desc: "Upload and edit videos for creators",
    },
    {
      value: "manager",
      icon: Settings,
      title: "Manager",
      desc: "Manage team operations and analytics",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-900 lg:grid lg:grid-cols-2">
      {/* ===== Brand panel ===== */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-teal-900 text-white p-12 xl:p-16">
        <div className="absolute inset-0 lp-dots-light" aria-hidden />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-yellow-400/20 blur-3xl" aria-hidden />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center">
            <Play className="w-4 h-4 text-stone-900 fill-stone-900 ml-0.5" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">videoflow</span>
        </Link>

        <div className="relative">
          <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight text-balance">
            Start shipping videos <span className="italic text-yellow-300">without the chaos.</span>
          </h2>
          <p className="mt-6 text-lg text-teal-100/90 max-w-md leading-relaxed">
            Set up your studio in minutes. Invite your editors, keep control, and publish straight to YouTube.
          </p>

          <ul className="mt-10 space-y-4 max-w-md">
            {[
              { icon: ShieldCheck, text: "Your password is never shared with editors" },
              { icon: Youtube, text: "One-click publishing with metadata & thumbnails" },
              { icon: Sparkles, text: "AI thumbnail studio included on every plan" },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/12 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-yellow-400" />
                </span>
                <span className="text-teal-50">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-sm text-teal-100/80">
          No credit card required · 14-day free trial
        </div>
      </aside>

      {/* ===== Form panel ===== */}
      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 lp-dots opacity-70 lg:hidden" aria-hidden />
        <div className="relative w-full max-w-md py-6">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex justify-center mb-8">
            <div className="relative w-40 h-11">
              <Image src="/image.png" alt="VideoFlow" fill className="object-contain" priority />
            </div>
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-stone-900">Create account</h1>
            <p className="mt-2 text-stone-600">
              Already have one?{" "}
              <Link href="/auth/login" className="font-semibold text-teal-700 hover:text-teal-800 underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-stone-700">
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Jane Creator"
                required
                disabled={isLoading}
                className="h-12 rounded-xl bg-white border-stone-300 focus-visible:border-teal-600 focus-visible:ring-teal-600/30"
              />
            </div>

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
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Create a password"
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

              {formData.password && (
                <div className="mt-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 bg-stone-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-600 font-medium">{getPasswordStrengthText()}</span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <p className="text-xs text-stone-500">Missing: {passwordStrength.feedback.join(", ")}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-stone-700">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-white border-stone-300 focus-visible:border-teal-600 focus-visible:ring-teal-600/30 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-3.5 hover:bg-transparent text-stone-400 hover:text-stone-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-xs text-teal-700 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-stone-700">Account type</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                className="space-y-2.5"
              >
                {roles.map((r) => {
                  const active = formData.role === r.value;
                  return (
                    <Label
                      key={r.value}
                      htmlFor={r.value}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                        active
                          ? "border-teal-600 bg-teal-700/5 ring-1 ring-teal-600/30"
                          : "border-stone-300 bg-white hover:border-teal-400"
                      }`}
                    >
                      <RadioGroupItem
                        value={r.value}
                        id={r.value}
                        className="border-stone-300 text-teal-700"
                      />
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          active ? "bg-teal-700 text-white" : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        <r.icon className="w-4.5 h-4.5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-stone-900">{r.title}</span>
                        <span className="block text-xs text-stone-500">{r.desc}</span>
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                className="mt-0.5 data-[state=checked]:bg-teal-700 data-[state=checked]:border-teal-700"
              />
              <Label htmlFor="terms" className="text-xs text-stone-600 cursor-pointer leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-teal-700 hover:text-teal-800 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-teal-700 hover:text-teal-800 underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="group w-full h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-full font-semibold shadow-lg shadow-teal-900/15 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={
                isLoading ||
                formData.password !== formData.confirmPassword ||
                !acceptTerms ||
                passwordStrength.score < 3
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-8">
            <Link href="/" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
