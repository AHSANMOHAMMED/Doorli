'use client';
import React from 'react';
import { useParams } from 'next/navigation';

export default function ThreadDetailPage() {
  const { id, threadId } = useParams();
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/v1/threads/${threadId}/posts`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [threadId]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thread Discussion</h1>
      </div>

      {loading ? (
        <div>Loading posts...</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post: any) => (
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
              <div className="text-gray-700 whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No posts in this thread yet.
            </div>
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
