export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200/80 ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="divide-y divide-[#E2E8F0]">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex items-center gap-4 px-5 py-3.5">
          {Array.from({ length: columns }).map((__, colIdx) => (
            <Skeleton
              key={colIdx}
              className={`h-4 ${colIdx === 0 ? 'w-24' : colIdx === 1 ? 'w-40' : 'flex-1'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

