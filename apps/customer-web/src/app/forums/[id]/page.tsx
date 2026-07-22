'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ForumThreadsPage() {
  const { id } = useParams();
  const [threads, setThreads] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/v1/forums/${id}/threads`)
      .then((res) => res.json())
      .then((data) => {
        setThreads(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Forum Threads</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          New Thread
        </button>
      </div>

      {loading ? (
        <div>Loading threads...</div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread: any) => (
            <Link href={`/forums/${id}/threads/${thread.id}`} key={thread.id}>
              <div className="border-b border-gray-200 py-4 hover:bg-gray-50 flex flex-col cursor-pointer px-4 rounded transition-colors">
                <h2 className="text-xl font-medium text-gray-900">{thread.title}</h2>
                <div className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                  <span>By {thread.author?.fullName || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{thread.viewCount} views</span>
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
