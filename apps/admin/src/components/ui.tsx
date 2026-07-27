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
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="doorli-rise flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-doorli-muted">{subtitle}</p>}
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
}: {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-card glass-card--lit p-6 ${className}`}>
      {(title || actions) && (
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-white">
            {icon && <span className="text-doorli-muted">{icon}</span>}
            {title}
          </h2>
          {actions}
        </header>
      )}
      {children}
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
    <div className={`glass-card glass-card--interactive glass-card--lit p-5 ${delay}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-doorli-muted">{label}</p>
        {icon && (
          <span
            className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${toneRing[tone]} text-white shadow-lg`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-doorli-dim">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
      {icon && (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-doorli-dim">{icon}</span>
      )}
      <p className="font-display text-base font-semibold text-white">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-doorli-dim">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableShell({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card glass-card--lit overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
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
