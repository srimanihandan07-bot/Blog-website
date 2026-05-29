import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, BookOpen, MessageSquare, Eye, Trash2, Ban, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0, totalViews: 0, activeUsers: 0 });
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('stats'); // 'stats', 'users', 'posts'

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      // Fetch Stats
      const statsRes = await fetch('/api/admin?action=stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch Users
      const usersRes = await fetch('/api/admin?action=users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch Posts
      const postsRes = await fetch('/api/admin?action=posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateUserRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change user role to ${nextRole}?`)) return;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/admin?action=update-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: nextRole })
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/admin?action=delete-post', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postId })
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2.5 rounded-2xl text-red-600 border border-red-100">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Admin Control Console</h1>
            <p className="text-xs text-slate-400 font-medium">Moderate platform users, articles, and monitor real-time platform statistics.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`pb-4 font-bold text-sm transition-all relative cursor-pointer ${activeSubTab === 'stats' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span>Overview Stats</span>
            {activeSubTab === 'stats' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`pb-4 font-bold text-sm transition-all relative cursor-pointer ${activeSubTab === 'users' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span>Manage Users ({users.length})</span>
            {activeSubTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
          <button
            onClick={() => setActiveSubTab('posts')}
            className={`pb-4 font-bold text-sm transition-all relative cursor-pointer ${activeSubTab === 'posts' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span>Moderate Posts ({posts.length})</span>
            {activeSubTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="h-64 bg-white rounded-3xl border border-slate-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : activeSubTab === 'stats' ? (
          /* Metrics Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl"><Users className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Users</p>
                <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><BookOpen className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Posts</p>
                <p className="text-2xl font-black text-slate-900">{stats.totalPosts}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-4">
              <div className="bg-purple-50 text-purple-600 p-3 rounded-xl"><MessageSquare className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Comments</p>
                <p className="text-2xl font-black text-slate-900">{stats.totalComments}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-4">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-xl"><Eye className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Views</p>
                <p className="text-2xl font-black text-slate-900">{stats.totalViews}</p>
              </div>
            </div>
          </div>
        ) : activeSubTab === 'users' ? (
          /* Users Moderation Table */
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase">
                    <th className="p-4">User</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
                        <span className="font-bold text-slate-900">{u.name}</span>
                      </td>
                      <td className="p-4">@{u.username}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${u.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleUpdateUserRole(u.id, u.role)}
                          className="text-xs font-bold border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Posts Moderation Table */
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase">
                    <th className="p-4">Post Title</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {posts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900 max-w-xs truncate">
                        <a href={`/posts/${p.slug}`} className="hover:text-indigo-600 transition-colors">{p.title}</a>
                      </td>
                      <td className="p-4">{p.profiles?.name || 'Unknown'}</td>
                      <td className="p-4">{p.category}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${p.status === 'draft' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeletePost(p.id)}
                          className="text-xs font-bold text-rose-600 border border-rose-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
