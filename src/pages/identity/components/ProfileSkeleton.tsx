import { Skeleton } from "@/components/ui/skeleton";

interface ProfileSkeletonProps {
  isEditMode: boolean;
}

export function ProfileSkeleton({ isEditMode }: ProfileSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Edit Mode Indicator Skeleton */}
      {isEditMode && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      )}

      {/* Profile Picture Skeleton */}
      <div className="flex flex-col items-center">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-8 w-28 mt-3" />
      </div>

      {/* Bio Field Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Social Media Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />

        {/* 4 Social Fields */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>

      {/* Domain Information Skeleton */}
      <div className="space-y-2 pt-4 border-t">
        <Skeleton className="h-4 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-background rounded-md p-3 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="bg-background rounded-md p-3 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>

      {/* Submit Button Skeleton */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
