import { Skeleton } from "../skeleton";
import { cn } from "@/lib/utils";

// Skeleton cho movie card
export const MovieSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-col gap-2", className)}>
    <Skeleton className="w-full aspect-[2/3] rounded-md h-64 sm:h-80" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

// Skeleton cho movie grid
export const MovieGridSkeleton = ({ 
  count = 10, 
  columns = 5,
  className 
}: { 
  count?: number;
  columns?: number;
  className?: string;
}) => (
  <div className={cn(
    "grid gap-4 md:gap-6",
    `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-${columns}`,
    className
  )}>
    {Array.from({ length: count }).map((_, index) => (
      <MovieSkeleton key={index} />
    ))}
  </div>
);

// Skeleton cho movie detail
export const MovieDetailSkeleton = () => (
  <div className="min-h-screen bg-gray-950">
    <div className="h-[50vh] md:h-[75vh] bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-[40vh] md:pt-[65vh]">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <Skeleton className="h-80 w-full mb-6" />
        </div>
        <div>
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    </div>
  </div>
);

// Skeleton cho movie slider
export const MovieSliderSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-3 overflow-hidden pb-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="relative flex-shrink-0 w-[calc(100%/5-12px)] min-w-[190px] py-4">
        <Skeleton className="aspect-[2/3] w-full rounded-lg" />
      </div>
    ))}
  </div>
);

// Skeleton cho search page
export const SearchPageSkeleton = () => (
  <div className="min-h-screen bg-gray-900 pt-20 pb-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <Skeleton className="h-10 w-48 mb-4 md:mb-0" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-16 w-full" />
        </div>
        <MovieGridSkeleton />
      </div>
    </div>
  </div>
);

// Skeleton cho login page
export const LoginPageSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg">
      <div className="flex justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-2/3 mx-auto" />
      <Skeleton className="h-4 w-1/3 mx-auto" />
      <div className="space-y-4 pt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
); 