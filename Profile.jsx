import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Save, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setAvatar(profile.avatar || '');
      const links = profile.social_links || {};
      setTwitter(links.twitter || '');
      setGithub(links.github || '');
      setLinkedin(links.linkedin || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          bio,
          avatar,
          social_links: { twitter, github, linkedin }
        })
      });

      if (res.ok) {
        setSuccess(true);
        await refreshProfile();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900">Edit Profile</h1>
          <div className="w-10"></div>
        </div>

        {/* Message Status */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm font-semibold text-emerald-600">
            Profile updated successfully!
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm font-semibold text-rose-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-100/30">
          
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-3">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop'}
              alt="Avatar Preview"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-50"
            />
            <div className="space-y-1 text-center">
              <label className="text-xs font-bold text-slate-700 block">Avatar URL</label>
              <input
                type="text"
                placeholder="https://api.dicebear.com/7.x/..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-center"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-semibold"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Bio</label>
            <textarea
              placeholder="Write a short bio about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium resize-none"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Social Links</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Twitter Username</label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">GitHub Username</label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">LinkedIn Username</label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t border-slate-50 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
