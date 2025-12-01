export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-border/60 rounded ${className}`} />
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-8 space-y-8 bg-background h-full">
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
        <div className="flex justify-between items-center">
           <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
           </div>
           <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <Skeleton className="h-32 w-full rounded-xl" />
      
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

export function ResultListSkeleton() {
  return (
    <div className="p-2 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-20 w-full bg-surface border border-border rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
