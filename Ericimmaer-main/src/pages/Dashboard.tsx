import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserAndPosts();
  }, []);

  const fetchUserAndPosts = async () => {
    setLoading(true);
    // Get logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // Query ONLY posts created by this user
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserPosts(data);
      }
    }
    setLoading(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (!error) {
        setUserPosts(userPosts.filter((post) => post.id !== postId));
      } else {
        alert('Failed to delete post: ' + error.message);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return <div className="text-center p-12 text-slate-400">Loading your dashboard...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
          <p className="text-slate-400 text-sm">Logged in as {user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
        >
          Sign Out
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Your Published Articles ({userPosts.length})</h2>
        <a
          href="/create"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all"
        >
          + Write New Post
        </a>
      </div>

      {/* Articles List */}
      {userPosts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-slate-400 mb-4">You haven't written any articles yet.</p>
          <a
            href="/create"
            className="text-amber-400 hover:underline font-medium"
          >
            Create your first article now &rarr;
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {userPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{post.title}</h3>
                <p className="text-slate-400 text-xs">
                  Published on {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/edit/${post.id}`}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all"
                >
                  Edit
                </a>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
