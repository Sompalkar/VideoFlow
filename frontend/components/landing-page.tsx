"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Play,
  ArrowRight,
  Youtube,
  Shield,
  Users,
  Zap,
  Star,
  Menu,
  X,
  TrendingUp,
  Award,
  Video,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { user } = useAuthStore();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
  };

  const features = [
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Assign roles to editors and reviewers. Maintain full control with built-in approval workflows before anything goes live.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Your YouTube credentials remain secure. Editors can upload directly without ever needing your channel password.",
    },
    {
      icon: Youtube,
      title: "Direct Publishing",
      description:
        "Push approved videos directly to YouTube with custom metadata, tags, and thumbnails—all from one dashboard.",
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description:
        "Track team productivity, video performance metrics, and upload frequency in a single, unified view.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Tech Creator • 2.5M Subs",
      content:
        "VideoFlow eliminated our bottleneck. Editors upload drafts, I approve them on my phone, and they go live. It's incredibly efficient.",
      avatar: "SC",
      color: "bg-blue-100 text-blue-700",
    },
    {
      name: "Mike Rodriguez",
      role: "Gaming Channel • 1.8M Subs",
      content:
        "I used to share my Google password with three editors. Now, they have their own logins, and I sleep better at night.",
      avatar: "MR",
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      name: "Emma Thompson",
      role: "Lifestyle Vlogger • 950K Subs",
      content:
        "The automated thumbnail generation and metadata management alone save us 10 hours a week. A game changer.",
      avatar: "ET",
      color: "bg-orange-100 text-orange-700",
    },
  ];

  const stats = [
    { value: "50K+", label: "Videos Processed" },
    { value: "2,000+", label: "Active Channels" },
    { value: "1M+", label: "Hours Saved" },
    { value: "99.9%", label: "Platform Uptime" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-40 h-12 transition-transform group-hover:scale-105">
                <Image src="/image.png" alt="Logo" fill className="object-contain" priority />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                Reviews
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                Pricing
              </Link>
              
              <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                <Link href={user ? "/dashboard" : "/auth/login"}>
                  <Button variant="ghost" className="text-sm font-medium hover:bg-slate-100">
                    {user ? "Dashboard" : "Log in"}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 py-4 pb-6 bg-white">
              <div className="space-y-1">
                <Link href="#features" className="block px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                  Features
                </Link>
                <Link href="#testimonials" className="block px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                  Reviews
                </Link>
                <Link href="#pricing" className="block px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                  Pricing
                </Link>
                <div className="pt-4 px-4 space-y-3 border-t border-slate-100 mt-2">
                  <Link href={user ? "/dashboard" : "/auth/login"} className="block w-full">
                    <Button variant="outline" className="w-full justify-center">
                      {user ? "Dashboard" : "Log in"}
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="block w-full">
                    <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white">
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className={`transition-all duration-1000 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <Badge className="mb-6 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-blue-100">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                  VideoFlow 2.0 is live
                </span>
              </Badge>

              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                Ship videos to YouTube <span className="text-blue-600">faster.</span>
              </h1>

              <p className="text-xl text-slate-600 mb-8 max-w-xl leading-relaxed">
                The secure bridge between your editors and your YouTube channel. Review, approve, and publish without ever sharing your password.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5">
                    Start 14-day free trial
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white border-slate-300 text-slate-700 hover:bg-slate-50 px-8 h-14 text-base font-semibold transition-all">
                  <Play className="mr-2 w-5 h-5 text-slate-500" />
                  See how it works
                </Button>
              </div>

              <div className="flex items-center space-x-4 text-sm text-slate-500 font-medium">
                <div className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5"/> No credit card required</div>
                <div className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5"/> Cancel anytime</div>
              </div>
            </div>

            {/* Hero Visual Mockup */}
            <div className={`relative transition-all duration-1000 delay-200 transform ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>
              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 md:p-4 aspect-video flex flex-col">
                {/* Mock UI Header */}
                <div className="flex items-center justify-between mb-4 px-2 border-b border-slate-800 pb-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-slate-400 font-medium font-mono">dashboard / approvals</div>
                </div>
                
                {/* Mock UI Content */}
                <div className="flex-1 bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-slate-700 rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-slate-700/60 rounded"></div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Ready for Review</Badge>
                  </div>
                  
                  <div className="flex-1 bg-slate-900/50 rounded border border-slate-700/50 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
                    <Video className="w-12 h-12 text-slate-600" />
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-auto">
                    <div className="h-8 w-24 bg-slate-700 rounded"></div>
                    <div className="h-8 w-24 bg-blue-600 rounded"></div>
                  </div>
                </div>
              </div>
              
              {/* Floating element */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Video Published</div>
                  <div className="text-xs text-slate-500">Just now • YouTube</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center justify-center text-center">
                <div className="text-3xl lg:text-4xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-3">
              Platform Features
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Built for teams who treat YouTube like a business.
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              We've stripped away the noise to give you exactly what you need: a bulletproof pipeline from your editor's render queue to your channel's public feed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 border border-blue-100">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Trusted by creators scaling their teams
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex items-center space-x-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-8 text-lg leading-relaxed flex-grow">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center pt-6 border-t border-slate-200">
                    <div className={`w-10 h-10 ${testimonial.color} rounded-full flex items-center justify-center font-bold text-sm mr-4`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm font-medium text-slate-500">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Take control of your upload pipeline today.
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Stop sharing passwords. Start shipping videos faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-slate-50 px-8 h-14 text-base font-semibold shadow-lg transition-transform hover:-translate-y-0.5">
                Start your 14-day free trial
              </Button>
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6 font-medium">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-6">
                <div className="relative w-40 h-12">
                  <Image src="/image.png" alt="Logo" fill className="object-contain" />
                </div>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs text-slate-400">
                The enterprise-grade publishing pipeline built exclusively for YouTube creators and their editing teams.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">API Integration</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} VideoFlow Inc. All rights reserved.</p>
            <div className="flex space-x-6">
              {/* Social icons could go here */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
