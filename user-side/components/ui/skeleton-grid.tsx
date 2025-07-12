import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface SkeletonGridProps {
  count?: number;
  aspect?: string; // e.g. 'aspect-video', 'aspect-square'
  className?: string;
  gridClassName?: string;
}

export function SkeletonGrid({
  count = 9,
  aspect = "aspect-video",
  className = "",
  gridClassName = "",
}: SkeletonGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-3",
        gridClassName
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "w-full h-20 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 animate-pulse",
            aspect,
            className
          )}
        />
      ))}
    </div>
  );
}
