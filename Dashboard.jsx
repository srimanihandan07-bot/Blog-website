import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BlogCard from '../components/BlogCard';
import { PlusCircle, Edit3, Trash2, Eye, Heart, MessageSquare, BookMarked, History } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [myPosts, setMyPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'bookmarks'

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      // Fetch my posts (including drafts)
      const postsRes = await fetch(`/api/posts?author_id=${user.id}&status=all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setMyPosts(postsData.posts || []);
      }

      // Fetch bookmarked posts
      // Since bookmarks table references posts, we can query it or let the API return bookmarks.
      // Let's query bookmarks directly from Supabase for simplicity
      const { data: bmData } = await client
        .from('bookmarks')
        .select('*, posts(*, profiles:author_id(*))')
        .eq('user_id', user.id);

      if (bmData) {
        // Enriched bookmarks with counts
        const enrichedBookmarks = await Promise.all(bmData.map(async (bm) => {
          const post = bm.posts;
          if (!post) return null;

          const { count: likesCount } = await client.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
          const { count: commentsCount } = await client.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_bookmarked: true
          };
        }));
        setBookmarks(enrichedBookmarks.filter(Boolean));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmark = async (postId) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`/api/posts?action=bookmark&id=${postId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Card Summary */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <img
              src={profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop'}
              alt={profile?.name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-indigo-50"
            />
            <div>
              <h1 className="text-2xl font-black text-slate-900">{profile?.name}</h1>
              <p className="text-sm font-semibold text-slate-400">@{profile?.username}</p>
              <p className="text-sm text-slate-500 mt-2 max-w-md font-medium leading-relaxed">{profile?.bio || 'No bio written yet. Edit your profile to write one!'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/profile"
              className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Edit Profile
            </Link>
            <Link
              to="/create-blog"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-100 transition-all"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Write Post</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-4 font-bold text-sm transition-all relative cursor-pointer ${activeTab === 'posts' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span>My Articles ({myPosts.length})</span>
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`pb-4 font-bold text-sm transition-all relative cursor-pointer ${activeTab === 'bookmarks' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="flex items-center gap-1.5">
              <BookMarked className="h-4 w-4" />
              <span>Bookmarks ({bookmarks.length})</span>
            </span>
            {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
        </div>

        {/* Main Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
                <div className="aspect-[16/10] bg-slate-100 rounded-xl"></div>
                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                <div className="h-6 bg-slate-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'posts' ? (
          myPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {myPosts.map((post) => (
                <div key={post.id} className="relative group">
                  <BlogCard post={post} onToggleBookmark={handleToggleBookmark} />
                  
                  {/* Overlay edit/delete tools */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Link
                      to={`/edit-blog/${post.id}`}
                      className="bg-white/95 backdrop-blur-sm p-2 rounded-xl text-slate-700 hover:text-indigo-600 shadow-md border border-slate-100 transition-colors"
                      title="Edit Post"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="bg-white/95 backdrop-blur-sm p-2 rounded-xl text-slate-700 hover:text-rose-600 shadow-md border border-slate-100 transition-colors cursor-pointer"
                      title="Delete Post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Status Tag (Draft/Published) */}
                  <div className="absolute top-4 left-4">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm ${post.status === 'draft' ? 'bg-amber-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                      {post.status === 'draft' ? 'Draft' : 'Published'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4">
              <p className="text-slate-400 font-semibold text-lg">You haven't written any articles yet.</p>
              <Link
                to="/create-blog"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>Write Your First Post</span>
              </Link>
            </div>
          )
        ) : (
          bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bookmarks.map((post) => (
                <BlogCard key={post.id} post={post} onToggleBookmark={handleToggleBookmark} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-2">
              <p className="text-slate-400 font-semibold text-lg">No bookmarked articles yet.</p>
              <p className="text-slate-400 text-sm font-medium">Browse articles and click the bookmark icon to save them here.</p>
              <Link to="/" className="text-indigo-600 font-bold hover:underline inline-block pt-2">Browse Articles</Link>
            </div>
          )
        )}

      </div>
    </div>
  );
}
