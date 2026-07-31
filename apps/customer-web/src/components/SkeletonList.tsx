export function SkeletonList({ count = 5, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="doorli-glass-card rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-white/[0.07] rounded w-3/4 mb-2" />
          <div className="h-3 bg-white/[0.07] rounded w-1/2" />
          <div className="h-8 bg-white/[0.07] rounded w-full mt-3" />
        </div>
      ))}
    </div>
  );
}
