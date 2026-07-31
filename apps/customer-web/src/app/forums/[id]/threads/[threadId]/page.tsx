'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Post = {
  id: string;
  content: string;
  createdAt: string;
  author?: { fullName?: string | null };
};

function forumBase() {
  return process.env.NEXT_PUBLIC_FORUM_SERVICE_URL || 'http://127.0.0.1:8087';
}

export default function ThreadDetailPage() {
  const { id, threadId } = useParams<{ id: string; threadId: string }>();
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch(`${forumBase()}/threads/${threadId}/posts`)
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        setPosts((data.data || []) as Post[]);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load posts');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [threadId]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/forums/${id}`} className="text-sm text-blue-600 underline">
          ← Back to threads
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Thread Discussion</h1>
      </div>

      {loading ? (
        <div>Loading posts...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <div className="flex items-center space-x-3 mb-4 border-b pb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  {post.author?.fullName?.[0] || 'A'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{post.author?.fullName || 'Anonymous'}</h3>
                  <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-gray-700 whitespace-pre-wrap">{post.content}</div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="text-center text-gray-500 py-10">No posts in this thread yet.</div>
          )}

          <div className="mt-8 border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Reply to thread</h3>
            <textarea
              className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Write your reply here..."
            />
            <button className="mt-3 bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
              Post Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
