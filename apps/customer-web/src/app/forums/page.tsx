import React from 'react';
import Link from 'next/link';

export default function ForumsPage() {
  const [forums, setForums] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/v1/forums')
      .then((res) => res.json())
      .then((data) => {
        setForums(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Forums</h1>
      </div>

      {loading ? (
        <div>Loading forums...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forums.map((forum: any) => (
            <Link href={`/forums/${forum.id}`} key={forum.id}>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white cursor-pointer">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xl">💬</span>
                  <h2 className="text-xl font-semibold text-blue-600">{forum.name}</h2>
                </div>
                <p className="text-gray-600">{forum.description}</p>
                <div className="mt-4 inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-600">
                  {forum.category}
                </div>
              </div>
            </Link>
          ))}
          {forums.length === 0 && (
            <div className="col-span-2 text-center text-gray-500 py-10">
              No forums available yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
