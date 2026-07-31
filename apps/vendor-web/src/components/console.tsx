import React from 'react';

type Tone = 'blue' | 'teal' | 'gold' | 'rose' | 'neutral';

const toneRing: Record<Tone, string> = {
  blue: 'from-[#185fa5] to-[#378add]',
  teal: 'from-[#1d9e75] to-[#5dcaa5]',
  gold: 'from-[#c9922f] to-[#fac775]',
  rose: 'from-[#c2415f] to-[#f2668b]',
  neutral: 'from-white/20 to-white/5',
};

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="doorli-rise flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-doorli-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  icon,
  actions,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`console-panel ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-white">
            {icon && <span className="text-doorli-muted">{icon}</span>}
            {title}
          </h2>
          {actions}
        </header>
      )}
      <div className={bodyClassName || 'p-5'}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
  delay = '',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  delay?: string;
}) {
  return (
    <div className={`console-panel console-panel-hover p-5 ${delay}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-doorli-muted">{label}</p>
        {icon && (
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${toneRing[tone]} text-white shadow-lg`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3.5 font-display text-2xl font-bold tracking-tight text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-doorli-dim">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}) {
  return <span className={`badge badge-${tone} capitalize`}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      {icon && (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-doorli-dim">{icon}</span>
      )}
      <p className="font-display text-base font-semibold text-white">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-doorli-dim">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TableShell({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="console-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="console-table w-full text-left text-sm">
          <thead>{head}</thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.07] ${className}`} />;
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(242,102,139,0.32)] bg-[rgba(242,102,139,0.12)] px-4 py-3 text-sm text-[#f2668b]">
      {children}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`doorli-glass-card rounded-xl p-5 space-y-3 ${className}`}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full mt-2" />
    </div>
  );
}

export function SkeletonList({ count = 5, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
