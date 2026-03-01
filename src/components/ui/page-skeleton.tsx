import { Skeleton } from '@/components/ui/skeleton'

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header card */}
      <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="h-1 w-full bg-slate-200" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
      </div>

      {/* Content cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
