"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Video,
  Upload,
  TrendingUp,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoStore } from "@/lib/stores/video-store";

export function DashboardNav() {
  const pathname = usePathname();
  const { videos } = useVideoStore();

  const pendingCount = videos.filter((v) => v.status === "pending").length;

  const navigation = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: BarChart3,
      exact: true,
    },
    {
      name: "Videos",
      href: "/dashboard/videos",
      icon: Video,
      badge: videos.length > 0 ? videos.length : undefined,
    },
    {
      name: "Upload",
      href: "/dashboard/upload",
      icon: Upload,
    },
    {
      name: "AI Thumbnails",
      href: "/dashboard/thumbnail-generator",
      icon: Sparkles,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: TrendingUp,
    },
  ];

  // Only show on dashboard routes
  if (!pathname.startsWith("/dashboard")) return null;

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 space-y-3 lg:space-y-0">
          {/* Navigation Links */}
          <div className="flex items-center overflow-x-auto scrollbar-hide space-x-4 lg:space-x-6 min-w-0">
            {navigation.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href) && pathname !== "/dashboard";
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">{item.name}</span>
                  <span className="sm:hidden">{item.name}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-2 text-xs flex-shrink-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex  items-center justify-between lg:justify-end space-x-3 min-w-0">
            {pendingCount > 0 && (
              <div className="text-xs sm:text-sm text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                {pendingCount} pending
              </div>
            )}
            <Button
              asChild
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              <Link href="/dashboard/upload">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">+</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
