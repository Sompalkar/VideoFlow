// "use client"

// import type React from "react"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Play, ArrowRight, Youtube, Shield, Users, Zap, Star, Menu, X, Sparkles, TrendingUp, Award } from "lucide-react"
// import Link from "next/link"

// export default function LandingPage() {
//   const [isVisible, setIsVisible] = useState(false)
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
//   const [email, setEmail] = useState("")

//   useEffect(() => {
//     setIsVisible(true)
//   }, [])

//   const handleNewsletterSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     console.log("Newsletter signup:", email)
//     setEmail("")
//   }

//   const features = [
//     {
//       icon: Users,
//       title: "Team Collaboration",
//       description: "Let your editors upload while you maintain full control with advanced approval workflows.",
//     },
//     {
//       icon: Shield,
//       title: "Bank-Level Security",
//       description: "Enterprise-grade security for your YouTube credentials with OAuth 2.0 and encrypted storage.",
//     },
//     {
//       icon: Youtube,
//       title: "Direct YouTube Upload",
//       description: "Seamless integration with YouTube API for instant publishing with custom metadata.",
//     },
//     {
//       icon: TrendingUp,
//       title: "Analytics & Insights",
//       description: "Comprehensive analytics dashboard with performance metrics and team productivity.",
//     },
//   ]

//   const testimonials = [
//     {
//       name: "Sarah Chen",
//       role: "Tech YouTuber",
//       subscribers: "2.5M",
//       content:
//         "VideoFlow transformed our workflow completely. We've increased our upload frequency by 300% while maintaining quality control.",
//       avatar: "SC",
//     },
//     {
//       name: "Mike Rodriguez",
//       role: "Gaming Creator",
//       subscribers: "1.8M",
//       content:
//         "The security features give me complete peace of mind. My team can work efficiently without compromising my channel.",
//       avatar: "MR",
//     },
//     {
//       name: "Emma Thompson",
//       role: "Lifestyle Channel",
//       subscribers: "950K",
//       content:
//         "Best investment I've made for my channel. The approval system is intuitive and the analytics are incredibly detailed.",
//       avatar: "ET",
//     },
//   ]

//   const stats = [
//     { value: "50K+", label: "Videos Uploaded" },
//     { value: "2K+", label: "Happy Creators" },
//     { value: "99.9%", label: "Uptime" },
//     { value: "24/7", label: "Support" },
//   ]

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Navigation */}
//       <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <Link href="/" className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <Play className="w-5 h-5 text-white fill-white" />
//               </div>
//               <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                 VideoFlow
//               </span>
//             </Link>

//             {/* Desktop Navigation */}
//             <div className="hidden md:flex items-center space-x-8">
//               <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
//                 Features
//               </Link>
//               <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
//                 Reviews
//               </Link>
//               <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
//                 Pricing
//               </Link>
//               <Link href="/auth/login">
//                 <Button variant="ghost" className="font-medium">
//                   Sign In
//                 </Button>
//               </Link>
//               <Link href="/auth/register">
//                 <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg">
//                   Get Started
//                 </Button>
//               </Link>
//             </div>

//             {/* Mobile menu button */}
//             <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
//               {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//             </Button>
//           </div>

//           {/* Mobile Navigation */}
//           {mobileMenuOpen && (
//             <div className="md:hidden border-t border-gray-100 py-4">
//               <div className="space-y-2">
//                 <Link href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
//                   Features
//                 </Link>
//                 <Link href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
//                   Reviews
//                 </Link>
//                 <Link href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
//                   Pricing
//                 </Link>
//                 <div className="pt-4 space-y-2">
//                   <Link href="/auth/login">
//                     <Button variant="outline" className="w-full bg-transparent">
//                       Sign In
//                     </Button>
//                   </Link>
//                   <Link href="/auth/register">
//                     <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">Get Started</Button>
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
//         <div className="max-w-7xl mx-auto">
//           <div
//             className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
//           >
//             <Badge
//               variant="secondary"
//               className="mb-6 px-4 py-2 bg-indigo-50 text-indigo-700 border-indigo-200 rounded-full"
//             >
//               <Sparkles className="w-4 h-4 mr-2" />
//               Trusted by 10,000+ Content Creators
//             </Badge>

//             <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
//               Streamline Your
//               <br />
//               <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
//                 Video Workflow
//               </span>
//             </h1>

//             <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
//               Empower your team with seamless video uploads, collaborative workflows, and secure credential management.
//               <br />
//               <span className="font-semibold text-gray-800">Let editors upload while you maintain full control.</span>
//             </p>

//             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
//               <Link href="/auth/register">
//                 <Button
//                   size="lg"
//                   className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all"
//                 >
//                   Start Free Trial
//                   <ArrowRight className="ml-2 w-5 h-5" />
//                 </Button>
//               </Link>
//               <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl border-2 bg-transparent">
//                 <Play className="mr-2 w-5 h-5" />
//                 Watch Demo
//               </Button>
//             </div>

//             {/* Stats */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
//               {stats.map((stat, index) => (
//                 <div key={index} className="text-center">
//                   <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
//                   <div className="text-gray-600 text-sm">{stat.label}</div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section id="features" className="py-24 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-20">
//             <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200 rounded-full">
//               <Zap className="w-4 h-4 mr-2" />
//               Powerful Features
//             </Badge>
//             <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Everything You Need</h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               Powerful features designed for modern content creators and their teams
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
//             {features.map((feature, index) => (
//               <Card
//                 key={index}
//                 className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50"
//               >
//                 <CardContent className="p-8">
//                   <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
//                     <feature.icon className="w-7 h-7 text-white" />
//                   </div>
//                   <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
//                   <p className="text-gray-600 leading-relaxed">{feature.description}</p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Testimonials */}
//       <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-20">
//             <Badge className="mb-4 bg-yellow-50 text-yellow-700 border-yellow-200 rounded-full">
//               <Award className="w-4 h-4 mr-2" />
//               Customer Love
//             </Badge>
//             <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Loved by Creators</h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               Join thousands of successful content creators who trust VideoFlow
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {testimonials.map((testimonial, index) => (
//               <Card key={index} className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300">
//                 <CardContent className="p-8">
//                   <div className="flex items-center mb-4">
//                     {[...Array(5)].map((_, i) => (
//                       <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
//                     ))}
//                   </div>
//                   <p className="text-gray-700 mb-6 text-lg leading-relaxed">"{testimonial.content}"</p>
//                   <div className="flex items-center">
//                     <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
//                       {testimonial.avatar}
//                     </div>
//                     <div className="ml-4">
//                       <div className="font-semibold text-gray-900">{testimonial.name}</div>
//                       <div className="text-sm text-gray-600">
//                         {testimonial.role} • {testimonial.subscribers} subscribers
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
//         <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
//           <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
//           <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
//             Join thousands of creators who have streamlined their upload process with VideoFlow
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
//             <Link href="/auth/register">
//               <Button
//                 size="lg"
//                 className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl shadow-xl"
//               >
//                 Start Your Free Trial
//                 <ArrowRight className="ml-2 w-5 h-5" />
//               </Button>
//             </Link>
//           </div>

//           <div className="max-w-md mx-auto">
//             <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
//               <Input
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-xl"
//                 required
//               />
//               <Button type="submit" variant="secondary" className="rounded-xl">
//                 Subscribe
//               </Button>
//             </form>
//             <p className="text-indigo-200 text-sm mt-3">Get updates on new features and tips</p>
//           </div>

//           <p className="text-indigo-200 text-sm mt-8">No credit card required • 14-day free trial • Cancel anytime</p>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//             <div>
//               <div className="flex items-center space-x-3 mb-6">
//                 <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
//                   <Play className="w-5 h-5 text-white fill-white" />
//                 </div>
//                 <span className="text-xl font-bold">VideoFlow</span>
//               </div>
//               <p className="text-gray-400 mb-6 leading-relaxed">
//                 Streamline your video workflow with secure, collaborative uploads to YouTube.
//               </p>
//             </div>

//             <div>
//               <h3 className="font-semibold mb-6">Product</h3>
//               <ul className="space-y-3 text-gray-400">
//                 <li>
//                   <Link href="#features" className="hover:text-white transition-colors">
//                     Features
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#pricing" className="hover:text-white transition-colors">
//                     Pricing
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     Security
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     API
//                   </Link>
//                 </li>
//               </ul>
//             </div>

//             <div>
//               <h3 className="font-semibold mb-6">Company</h3>
//               <ul className="space-y-3 text-gray-400">
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     About
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     Blog
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     Careers
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     Contact
//                   </Link>
//                 </li>
//               </ul>
//             </div>

//             <div>
//               <h3 className="font-semibold mb-6">Support</h3>
//               <ul className="space-y-3 text-gray-400">
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     Help Center
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     Documentation
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     Status
//                   </Link>
//                 </li>
//                 <li>
//                   <Link href="#" className="hover:text-white transition-colors">
//                     Privacy
//                   </Link>
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
//             <p>&copy; 2025 VideoFlow. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }





























"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  BarChart3,
  Rocket,
  Globe,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Newsletter signup:", email)
    setEmail("")
  }

  const features = [
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Let your editors upload while you maintain full control with advanced approval workflows.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Enterprise-grade security for your YouTube credentials with OAuth 2.0 and encrypted storage.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Youtube,
      title: "Direct YouTube Upload",
      description: "Seamless integration with YouTube API for instant publishing with custom metadata.",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: TrendingUp,
      title: "Analytics & Insights",
      description: "Comprehensive analytics dashboard with performance metrics and team productivity.",
      color: "from-purple-500 to-violet-500",
    },
    {
      icon: Clock,
      title: "Scheduled Publishing",
      description: "Plan and schedule your content releases with precision timing and automated workflows.",
      color: "from-orange-500 to-amber-500",
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      description: "Monitor upload success rates, team productivity, and channel growth metrics in real-time.",
      color: "from-indigo-500 to-blue-500",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Tech YouTuber",
      subscribers: "2.5M",
      content:
        "VideoFlow transformed our workflow completely. We've increased our upload frequency by 300% while maintaining quality control.",
      avatar: "SC",
      rating: 5,
    },
    {
      name: "Mike Rodriguez",
      role: "Gaming Creator",
      subscribers: "1.8M",
      content:
        "The security features give me complete peace of mind. My team can work efficiently without compromising my channel.",
      avatar: "MR",
      rating: 5,
    },
    {
      name: "Emma Thompson",
      role: "Lifestyle Channel",
      subscribers: "950K",
      content:
        "Best investment I've made for my channel. The approval system is intuitive and the analytics are incredibly detailed.",
      avatar: "ET",
      rating: 5,
    },
  ]

  const stats = [
    { value: "50K+", label: "Videos Uploaded", icon: Play },
    { value: "2K+", label: "Happy Creators", icon: Heart },
    { value: "99.9%", label: "Uptime", icon: CheckCircle },
    { value: "24/7", label: "Support", icon: MessageCircle },
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$19",
      period: "/month",
      description: "Perfect for individual creators",
      features: ["Up to 50 uploads/month", "2 team members", "Basic analytics", "Email support", "Standard security"],
      popular: false,
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "Ideal for growing channels",
      features: [
        "Unlimited uploads",
        "10 team members",
        "Advanced analytics",
        "Priority support",
        "Advanced security",
        "Custom workflows",
        "API access",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For large organizations",
      features: [
        "Everything in Professional",
        "Unlimited team members",
        "White-label solution",
        "Dedicated support",
        "Custom integrations",
        "SLA guarantee",
        "Advanced reporting",
      ],
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                VideoFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                Reviews
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" className="font-medium hover:bg-gray-50 transition-all duration-300">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-gray-50 transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 animate-in slide-in-from-top duration-300">
              <div className="space-y-2">
                <Link href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-300">
                  Features
                </Link>
                <Link href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-300">
                  Reviews
                </Link>
                <Link href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-300">
                  Pricing
                </Link>
                <div className="pt-4 space-y-2">
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full bg-transparent hover:bg-gray-50 transition-all duration-300">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden"
      >
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-20 animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          ></div>
          <div 
            className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-10 animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          ></div>
          <div 
            className="absolute bottom-20 left-1/4 w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-15 animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <Badge variant="secondary" className="mb-6 px-4 py-2 bg-indigo-50 text-indigo-700 border-indigo-200 rounded-full hover:bg-indigo-100 transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-5">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by 10,000+ Content Creators
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight animate-in fade-in-50 slide-in-from-bottom-10 duration-700">
              Streamline Your
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                Video Workflow
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-in fade-in-50 slide-in-from-bottom-10 duration-1000">
              Empower your team with seamless video uploads, collaborative workflows, and secure credential management.
              <br />
              <span className="font-semibold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Let editors upload while you maintain full control.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-in fade-in-50 slide-in-from-bottom-10 duration-1200">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl border-2 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:scale-105 group">
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-in fade-in-50 slide-in-from-bottom-10 duration-1400">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-all duration-300">
                    <stat.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className={`text-3xl md:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200 rounded-full hover:bg-blue-100 transition-all duration-300">
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed for modern content creators and their teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 hover:-translate-y-2">
                <CardContent className="p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg%3E%3Cg fill=\"none\" fillRule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fillOpacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-yellow-50 text-yellow-700 border-yellow-200 rounded-full hover:bg-yellow-100 transition-all duration-300">
              <Award className="w-4 h-4 mr-2" />
              Customer Love
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Creators
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of successful content creators who trust VideoFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 group">
                <CardContent className="p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:scale-150 transition-all duration-500"></div>
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed relative z-10">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg group-hover:scale-110 transition-all duration-300">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role} • {testimonial.subscribers} subscribers
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-green-50 text-green-700 border-green-200 rounded-full">
              <Rocket className="w-4 h-4 mr-2" />
              Simple Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and scale as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${plan.popular ? 'border-indigo-500 shadow-2xl scale-105' : 'border-gray-200 hover:border-indigo-300'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full py-3 rounded-xl transition-all duration-300 ${plan.popular ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl' : 'bg-gray-900 hover:bg-gray-800'}`}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg%3E%3Cg fill=\"none\" fillRule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fillOpacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 animate-in fade-in-50 slide-in-from-bottom-5">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-in fade-in-50 slide-in-from-bottom-5 duration-700">
            Join thousands of creators who have streamlined their upload process with VideoFlow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-1000">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
          <div className="max-w-md mx-auto animate-in fade-in-50 slide-in-from-bottom-5 duration-1200">
            <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-xl backdrop-blur-sm focus:bg-white/30 transition-all duration-300"
                required
              />
              <Button type="submit" variant="secondary" className="rounded-xl bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300">
                Subscribe
              </Button>
            </form>
            <p className="text-white/80 text-sm mt-3">Get updates on new features and tips</p>
          </div>
          <p className="text-white/80 text-sm mt-8">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6 group">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-bold">VideoFlow</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Streamline your video workflow with secure, collaborative uploads to YouTube.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300">
                  <Globe className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-white">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Security</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-white">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-white">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Status</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VideoFlow. All rights reserved. Made with ❤️ for creators worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
