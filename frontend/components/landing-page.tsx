"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Play,
  ArrowRight,
  Youtube,
  ShieldCheck,
  Users,
  Sparkles,
  Star,
  Menu,
  X,
  TrendingUp,
  CheckCircle2,
  UploadCloud,
  Eye,
  Send,
  Lock,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#testimonials", label: "Reviews" },
    { href: "#pricing", label: "Pricing" },
  ];

  const features = [
    {
      icon: Users,
      title: "Role-based collaboration",
      description:
        "Give editors and reviewers their own logins with scoped permissions. Approvals are built in, so nothing goes live without a green light.",
    },
    {
      icon: ShieldCheck,
      title: "Your password stays yours",
      description:
        "Editors upload and publish through VideoFlow's secure bridge—your YouTube credentials are never shared, stored, or exposed.",
    },
    {
      icon: Youtube,
      title: "One-click publishing",
      description:
        "Push approved videos straight to YouTube with titles, tags, descriptions, and thumbnails attached. No tab-switching, no re-uploads.",
    },
    {
      icon: Sparkles,
      title: "AI thumbnail studio",
      description:
        "Generate scroll-stopping thumbnails in seconds and A/B them before launch—without ever touching a design tool.",
    },
    {
      icon: TrendingUp,
      title: "Unified analytics",
      description:
        "Track team throughput, approval turnaround, and video performance side by side in one calm dashboard.",
    },
    {
      icon: Lock,
      title: "Audit-ready by default",
      description:
        "Every upload, edit, and approval is logged. Know exactly who changed what, and roll back with confidence.",
    },
  ];

  const steps = [
    {
      icon: UploadCloud,
      title: "Editors upload",
      description:
        "Your team drops finished cuts into VideoFlow with metadata and thumbnails, straight from the render queue.",
    },
    {
      icon: Eye,
      title: "You review & approve",
      description:
        "Preview, comment, and approve from any device. Request changes inline without leaving the dashboard.",
    },
    {
      icon: Send,
      title: "We publish to YouTube",
      description:
        "One tap sends the approved video live with everything attached—no passwords ever change hands.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Tech Creator · 2.5M subs",
      content:
        "VideoFlow killed our bottleneck. Editors upload drafts, I approve on my phone, and they go live. Effortless.",
      avatar: "SC",
    },
    {
      name: "Mike Rodriguez",
      role: "Gaming Channel · 1.8M subs",
      content:
        "I used to share my Google password with three editors. Now everyone has their own login and I sleep better at night.",
      avatar: "MR",
    },
    {
      name: "Emma Thompson",
      role: "Lifestyle Vlogger · 950K subs",
      content:
        "Automated thumbnails and metadata alone save us ten hours a week. It's a genuine game changer.",
      avatar: "ET",
    },
  ];

  const stats = [
    { value: "50K+", label: "Videos processed" },
    { value: "2,000+", label: "Active channels" },
    { value: "1M+", label: "Creator hours saved" },
    { value: "99.9%", label: "Platform uptime" },
  ];

  const pricing = [
    {
      name: "Creator",
      price: "$0",
      cadence: "/mo",
      blurb: "For solo creators getting organized.",
      features: ["1 channel", "2 team members", "AI thumbnails", "Direct publishing"],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Studio",
      price: "$29",
      cadence: "/mo",
      blurb: "For growing teams shipping weekly.",
      features: ["3 channels", "Unlimited members", "Approval workflows", "Advanced analytics", "Priority support"],
      cta: "Start 14-day trial",
      highlight: true,
    },
    {
      name: "Agency",
      price: "Custom",
      cadence: "",
      blurb: "For agencies managing many channels.",
      features: ["Unlimited channels", "SSO & audit logs", "Roles & permissions", "Dedicated CSM"],
      cta: "Talk to sales",
      highlight: false,
    },
  ];

  const trustLogos = ["CreatorLabs", "PixelForge", "StreamHaus", "NorthCut", "Loop Media", "Vantage"];

  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans text-stone-900 antialiased selection:bg-teal-700 selection:text-white">
      {/* ===== Navigation ===== */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#FAF6EE]/85 backdrop-blur-xl border-b border-stone-900/10"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center group">
              <div className="relative w-36 h-10 transition-transform duration-300 group-hover:scale-[1.03]">
                <Image src="/image.png" alt="VideoFlow" fill className="object-contain object-left" priority />
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 pl-5 border-l border-stone-900/10">
                <Link href={user ? "/dashboard" : "/auth/login"}>
                  <Button variant="ghost" className="text-sm font-medium text-stone-700 hover:bg-stone-900/5 rounded-full">
                    {user ? "Dashboard" : "Log in"}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="group text-sm font-semibold bg-teal-700 text-white hover:bg-teal-800 rounded-full px-5 shadow-sm">
                    Get started
                    <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-stone-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-stone-900/10 py-4 pb-6 bg-[#FAF6EE]">
              <div className="space-y-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-stone-700 hover:bg-stone-900/5 rounded-xl"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="pt-4 px-4 space-y-3 border-t border-stone-900/10 mt-2">
                  <Link href={user ? "/dashboard" : "/auth/login"} className="block w-full">
                    <Button variant="outline" className="w-full justify-center rounded-full border-stone-300">
                      {user ? "Dashboard" : "Log in"}
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="block w-full">
                    <Button className="w-full justify-center bg-teal-700 hover:bg-teal-800 text-white rounded-full">
                      Get started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 lp-dots" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="lp-animate inline-flex items-center gap-2 rounded-full border border-teal-700/20 bg-teal-700/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-800">
                <span className="relative flex h-2 w-2">
                  <span className="lp-pulse-ring absolute inline-flex h-full w-full rounded-full bg-yellow-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
                </span>
                VideoFlow 2.0 is live
              </div>

              <h1 className="lp-animate lp-d1 font-display mt-6 text-[3.25rem] leading-[0.98] sm:text-6xl lg:text-[4.5rem] font-semibold tracking-tight text-stone-900 text-balance">
                Ship videos to YouTube without the{" "}
                <span className="lp-mark italic text-teal-800">chaos.</span>
              </h1>

              <p className="lp-animate lp-d2 mt-7 text-lg sm:text-xl text-stone-600 max-w-xl leading-relaxed">
                The secure bridge between your editors and your channel. Review, approve, and publish—without ever
                handing over your password.
              </p>

              <div className="lp-animate lp-d3 mt-9 flex flex-col sm:flex-row gap-3.5">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="group w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white px-7 h-14 rounded-full text-base font-semibold shadow-lg shadow-teal-900/15 transition-all hover:-translate-y-0.5"
                  >
                    Start 14-day free trial
                    <ArrowRight className="ml-1.5 w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/60 border-stone-300 text-stone-800 hover:bg-white hover:text-stone-900 px-7 h-14 rounded-full text-base font-semibold"
                >
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400">
                    <Play className="w-3.5 h-3.5 text-stone-900 fill-stone-900 ml-0.5" />
                  </span>
                  Watch demo
                </Button>
              </div>

              <div className="lp-animate lp-d4 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-500 font-medium">
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 mr-1.5" /> No credit card required
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 mr-1.5" /> Cancel anytime
                </span>
              </div>
            </div>

            {/* Product mockup */}
            <div className="lp-animate lp-d3 lg:col-span-6 relative">
              {/* warm panel behind */}
              <div className="absolute -inset-3 sm:-inset-5 rounded-[2.25rem] bg-teal-700/8 -rotate-2" aria-hidden />
              <div className="relative rounded-[1.75rem] bg-white border border-stone-900/8 shadow-2xl shadow-stone-900/10 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 px-1.5 pb-3 border-b border-stone-100">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-300" />
                    <div className="w-3 h-3 rounded-full bg-yellow-300" />
                    <div className="w-3 h-3 rounded-full bg-teal-300" />
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">videoflow / approvals</div>
                  <div className="w-10" />
                </div>

                <div className="rounded-2xl bg-[#FAF6EE] border border-stone-900/6 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="h-3.5 w-44 bg-stone-300/80 rounded-full" />
                      <div className="h-2.5 w-28 bg-stone-200 rounded-full" />
                    </div>
                    <span className="shrink-0 rounded-full bg-teal-700/10 text-teal-800 border border-teal-700/20 text-xs font-semibold px-2.5 py-1">
                      Ready for review
                    </span>
                  </div>

                  <div className="relative aspect-video rounded-xl bg-white border border-stone-900/6 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 lp-dots opacity-60" aria-hidden />
                    <div className="relative z-10 w-14 h-14 rounded-full bg-teal-700 flex items-center justify-center shadow-lg shadow-teal-900/25">
                      <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <div className="w-6 h-6 rounded-full bg-teal-700/15 border border-teal-700/20" />
                      Uploaded by editor
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 px-3 rounded-full bg-stone-100 flex items-center text-[11px] text-stone-600">
                        Request changes
                      </div>
                      <div className="h-8 px-3 rounded-full bg-teal-700 flex items-center text-[11px] font-semibold text-white">
                        Approve & publish
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating published card */}
              <div className="lp-float absolute -bottom-6 -left-3 sm:-left-7 bg-white text-stone-900 p-3.5 pr-5 rounded-2xl shadow-xl shadow-stone-900/10 border border-stone-900/8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-700/10 flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight">Video published</div>
                  <div className="text-xs text-stone-500">Just now · YouTube</div>
                </div>
              </div>

              {/* Floating secure chip */}
              <div
                className="lp-float absolute -top-4 -right-2 sm:-right-5 bg-yellow-400 text-stone-900 px-3.5 py-2 rounded-2xl shadow-lg shadow-yellow-900/15 flex items-center gap-2"
                style={{ animationDelay: "1.2s" }}
              >
                <ShieldCheck className="w-4 h-4 text-stone-900" />
                <span className="text-xs font-bold">Password never shared</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust marquee */}
        <div className="relative border-y border-stone-900/8 bg-[#F4ECDD]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
            <p className="text-center text-xs font-medium uppercase tracking-widest text-stone-500 mb-5">
              Trusted by creators and studios worldwide
            </p>
            <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
              <div className="lp-marquee flex w-max items-center gap-14">
                {[...trustLogos, ...trustLogos].map((name, i) => (
                  <span key={i} className="font-display text-xl font-semibold text-stone-400 whitespace-nowrap tracking-tight">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="bg-[#FAF6EE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-5xl lg:text-6xl font-semibold tracking-tight text-teal-800">
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-medium text-stone-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="bg-[#F4ECDD] py-24 border-y border-stone-900/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold tracking-wide uppercase text-teal-700">Platform</span>
            <h2 className="font-display mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-stone-900 leading-[1.05]">
              Everything a creator team needs—<span className="italic text-teal-800">nothing it doesn't.</span>
            </h2>
            <p className="mt-5 text-lg text-stone-600 leading-relaxed">
              A bulletproof pipeline from your editor's render queue to your channel's public feed, with security and
              oversight baked in.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative rounded-3xl bg-[#FAF6EE] border border-stone-900/8 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/8 hover:bg-white"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center mb-5 transition-transform duration-300 group-hover:-rotate-6">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-[15px] text-stone-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="bg-[#FAF6EE] py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold tracking-wide uppercase text-teal-700">How it works</span>
            <h2 className="font-display mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-stone-900">
              Upload to published in <span className="italic text-teal-800">three steps</span>
            </h2>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-10 relative">
            <div
              className="hidden md:block absolute top-9 left-[16.6%] right-[16.6%] border-t-2 border-dashed border-teal-700/25"
              aria-hidden
            />
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="relative z-10 mx-auto w-[72px] h-[72px] rounded-3xl bg-white border border-stone-900/8 shadow-sm flex items-center justify-center">
                  <s.icon className="w-7 h-7 text-teal-700" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-yellow-400 text-stone-900 text-sm font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display mt-6 text-xl font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-[15px] text-stone-600 leading-relaxed max-w-xs mx-auto">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section id="testimonials" className="relative overflow-hidden bg-teal-900 text-white py-24">
        <div className="absolute inset-0 lp-dots-light" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-sm font-semibold tracking-wide uppercase text-yellow-400">Loved by creators</span>
            <h2 className="font-display mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
              Trusted by teams past a <span className="italic text-yellow-300">million subs</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white/8 border border-white/12 p-7 backdrop-blur transition-colors hover:bg-white/[0.12] flex flex-col"
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-[18px] h-[18px] text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-teal-50 text-[17px] leading-relaxed flex-grow font-display italic">"{t.content}"</p>
                <div className="flex items-center gap-3 mt-7 pt-6 border-t border-white/12">
                  <div className="w-10 h-10 rounded-full bg-yellow-400 text-stone-900 flex items-center justify-center font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-teal-200/80">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="bg-[#F4ECDD] py-24 border-y border-stone-900/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-sm font-semibold tracking-wide uppercase text-teal-700">Pricing</span>
            <h2 className="font-display mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-stone-900">
              Plans that grow with your channel
            </h2>
            <p className="mt-4 text-lg text-stone-600">Start free. Upgrade when your team does.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {pricing.map((p, i) => (
              <div
                key={i}
                className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                  p.highlight
                    ? "bg-teal-900 text-white shadow-2xl shadow-teal-900/25 md:-translate-y-3"
                    : "bg-[#FAF6EE] text-stone-900 border border-stone-900/8 hover:shadow-lg hover:shadow-stone-900/5"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-stone-900 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                    Most popular
                  </span>
                )}
                <h3 className={`font-display text-xl font-semibold ${p.highlight ? "text-white" : "text-stone-900"}`}>
                  {p.name}
                </h3>
                <p className={`mt-1 text-sm ${p.highlight ? "text-teal-100/80" : "text-stone-500"}`}>{p.blurb}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-semibold tracking-tight">{p.price}</span>
                  <span className={`text-sm ${p.highlight ? "text-teal-100/80" : "text-stone-500"}`}>{p.cadence}</span>
                </div>
                <ul className="mt-6 space-y-3 flex-grow">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-[15px]">
                      <Check className={`w-[18px] h-[18px] shrink-0 ${p.highlight ? "text-yellow-400" : "text-teal-700"}`} />
                      <span className={p.highlight ? "text-teal-50" : "text-stone-700"}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="mt-8 block">
                  <Button
                    className={`w-full h-12 rounded-full text-base font-semibold ${
                      p.highlight
                        ? "bg-yellow-400 hover:bg-yellow-300 text-stone-900"
                        : "bg-teal-700 hover:bg-teal-800 text-white"
                    }`}
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[#FAF6EE] py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-teal-900 px-8 py-16 sm:px-16 text-center">
            <div className="absolute inset-0 lp-dots-light" aria-hidden />
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl" aria-hidden />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight text-white text-balance leading-[1.02]">
                Take control of your <span className="italic text-yellow-300">upload pipeline</span> today
              </h2>
              <p className="mt-6 text-lg text-teal-100/90 max-w-2xl mx-auto">
                Stop sharing passwords. Start shipping videos faster—with a team you can actually trust.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3.5 justify-center">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="group w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-stone-900 px-8 h-14 rounded-full text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    Start your free trial
                    <ArrowRight className="ml-1.5 w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href={user ? "/dashboard" : "/auth/login"}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/5 border-white/25 text-white hover:bg-white/10 hover:text-white px-8 h-14 rounded-full text-base font-semibold"
                  >
                    {user ? "Go to dashboard" : "Log in"}
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-teal-200/80">No credit card required · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-stone-950 text-stone-400 pt-16 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
                <span className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center">
                  <Play className="w-4 h-4 text-stone-900 fill-stone-900 ml-0.5" />
                </span>
                <span className="font-display text-2xl font-semibold tracking-tight text-white">videoflow</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs">
                The secure publishing pipeline built exclusively for YouTube creators and their editing teams.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-yellow-400 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-yellow-400 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-yellow-400 transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} VideoFlow Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-yellow-400" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
