export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`doorli-glass-card rounded-xl p-5 space-y-3 ${className}`}>
      <div className="animate-pulse rounded-lg bg-white/[0.07] h-4 w-3/4" />
      <div className="animate-pulse rounded-lg bg-white/[0.07] h-3 w-1/2" />
      <div className="animate-pulse rounded-lg bg-white/[0.07] h-8 w-full mt-2" />
    </div>
  );
}
