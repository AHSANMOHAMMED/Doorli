'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Thread = {
  id: string;
  title: string;
  content?: string | null;
  createdAt: string;
  viewCount?: number;
  author?: { fullName?: string | null };
};

type Forum = {
  id: string;
  name: string;
  description?: string;
  category?: string;
};

function forumBase() {
  return process.env.NEXT_PUBLIC_FORUM_SERVICE_URL || 'http://127.0.0.1:8087';
}

export default function ForumThreadsPage() {
  const { id } = useParams<{ id: string }>();
  const [forum, setForum] = React.useState<Forum | null>(null);
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${forumBase()}/forums`).then((res) => res.json()),
      fetch(`${forumBase()}/forums/${id}/threads`).then((res) => res.json()),
    ])
      .then(([forumsJson, threadsJson]) => {
        if (!alive) return;
        const forums = (forumsJson.data || []) as Forum[];
        setForum(forums.find((item) => item.id === id) || null);
        setThreads((threadsJson.data || []) as Thread[]);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load forum');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/forums" className="underline">Forums</Link>
            {forum?.category ? ` · ${forum.category}` : ''}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{forum?.name || 'Forum threads'}</h1>
          {forum?.description && <p className="text-gray-600 mt-2">{forum.description}</p>}
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          New Thread
        </button>
      </div>

      {loading ? (
        <div>Loading threads...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <Link href={`/forums/${id}/threads/${thread.id}`} key={thread.id}>
              <div className="border-b border-gray-200 py-4 hover:bg-gray-50 flex flex-col cursor-pointer px-4 rounded transition-colors">
                <h2 className="text-xl font-medium text-gray-900">{thread.title}</h2>
                <div className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                  <span>By {thread.author?.fullName || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{thread.viewCount || 0} views</span>
                </div>
              </div>
            </Link>
          ))}
          {threads.length === 0 && (
            <div className="text-center text-gray-500 py-10 border rounded bg-gray-50">
              No threads found. Be the first to start a discussion!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
