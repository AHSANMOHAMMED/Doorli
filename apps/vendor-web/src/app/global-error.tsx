'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Something went wrong</h1>
          <p>An unexpected error occurred. Please try again.</p>
          <button onClick={() => reset()} style={{ textDecoration: 'underline' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
