import { RankingTableSkeleton } from '@/components/avaliacao/RankingTableSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="h-6 w-32 rounded-lg mb-1" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
      </div>
      <RankingTableSkeleton />
    </div>
  )
}
