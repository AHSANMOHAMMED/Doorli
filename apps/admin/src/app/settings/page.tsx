'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Check, Trash2, Info } from 'lucide-react';
import { PageHeader, Panel, Badge } from '@/components/ui';

export default function SettingsPage() {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem('doorli_admin_token')));
  }, []);

  function save() {
    localStorage.setItem('doorli_admin_token', token.trim());
    setSaved(true);
    setHasToken(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function clear() {
    localStorage.removeItem('doorli_admin_token');
    setToken('');
    setHasToken(false);
  }

  return (
    <>
      <PageHeader
        title="Platform Settings"
        subtitle="Manage the credentials this console uses to reach the Doorli API."
        actions={<Badge tone={hasToken ? 'success' : 'warning'}>{hasToken ? 'Token stored' : 'No token'}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Admin access token" icon={<KeyRound size={17} />} className="lg:col-span-2">
          <p className="mb-4 text-sm text-doorli-muted">
            Paste an admin JWT issued by <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-xs text-doorli-mint">/api/v1/auth/verify-otp</code>{' '}
            with <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-xs text-doorli-mint">role=admin</code> to load live data.
          </p>

          <textarea
            className="input min-h-[130px] resize-y font-mono text-xs leading-relaxed"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="eyJhbGciOi…"
            spellCheck={false}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button onClick={save} disabled={!token.trim()} className="btn btn-primary">
              Save token
            </button>
            {hasToken && (
              <button onClick={clear} className="btn btn-danger">
                <Trash2 size={15} />
                Clear
              </button>
            )}
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-doorli-mint">
                <Check size={15} />
                Saved
              </span>
            )}
          </div>
        </Panel>

        <Panel title="How this works" icon={<Info size={17} />}>
          <ul className="space-y-3 text-sm text-doorli-muted">
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-doorli-sky" />
              The token is kept in this browser only, under <code className="text-xs text-doorli-mint">localStorage</code>.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-doorli-teal" />
              Every admin request attaches it as a bearer token.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-doorli-gold" />
              Clearing it signs you out of the console immediately.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
