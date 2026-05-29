import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import { BookOpen, Image, Save, ArrowLeft } from 'lucide-react';

export default function CreateBlog() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tagsInput, setTagsInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [status, setStatus] = useState('published'); // 'draft', 'published'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categories] = useState(['Technology', 'Development', 'Design', 'Tutorials', 'Marketing']);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const client = createClient(supabaseUrl, supabaseAnonKey);
        const session = await client.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileBase64: base64,
            contentType: file.type
          })
        });

        const data = await res.json();
        if (res.ok) {
          setFeaturedImage(data.url);
        } else {
          setError(data.error || 'Failed to upload image');
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError('Image upload failed.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      setLoading(false);
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          featured_image: featuredImage,
          category,
          tags,
          status
        })
      });

      const data = await res.json();
      if (res.ok) {
        navigate('/dashboard');
      } else {
        setError(data.error || 'Failed to create post');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900">Create New Post</h1>
          <div className="w-10"></div> {/* spacer */}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm font-semibold text-rose-600">
            {error}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-100/30">
          
          {/* Post Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Article Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Mastering Tailwind CSS v4 in React"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-base px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-semibold"
            />
          </div>

          {/* Featured Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Featured Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium"
              />
              <div className="relative pt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  <Image className="h-4 w-4" />
                  <span>Upload Local Image</span>
                </label>
              </div>
            </div>

            {/* Image Preview */}
            <div className="border border-dashed border-slate-200 rounded-2xl aspect-[16/10] overflow-hidden flex items-center justify-center bg-slate-50 relative">
              {featuredImage ? (
                <img src={featuredImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-slate-400">Image Preview</span>
              )}
            </div>
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-semibold cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="react, tailwindcss, design"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium"
              />
            </div>
          </div>

          {/* Rich Content Editor */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Content</label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          {/* Publish Status & Actions */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-700">Status:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${status === 'published' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Publish Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${status === 'draft' ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Save as Draft
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{loading ? 'Saving...' : status === 'draft' ? 'Save Draft' : 'Publish Article'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
