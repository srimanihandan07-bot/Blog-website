import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from '../components/CommentSection';
import { Eye, Heart, Bookmark, Calendar, Clock, Share2, ArrowLeft, ChevronRight } from 'lucide-react';

export default function BlogDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const fetchPostDetails = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/posts?slug=${slug}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPost(data);
        setLiked(data.is_liked);
        setBookmarked(data.is_bookmarked);
        setLikesCount(data.likes_count);

        // Fetch related posts (same category, limit 3)
        const relatedRes = await fetch(`/api/posts?category=${data.category}&limit=3`);
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          setRelatedPosts((relatedData.posts || []).filter(p => p.id !== data.id));
        }
      } else {
        navigate('/404');
      }
    } catch (err) {
      console.error('Error fetching post details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [slug]);

  const handleLike = async () => {
    if (!user) {
      alert('Please sign in to like posts!');
      return;
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`/api/posts?action=like&id=${post.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      alert('Please sign in to bookmark posts!');
      return;
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`/api/posts?action=bookmark&id=${post.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const renderMarkdownToHTML = (md) => {
    if (!md) return '';
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-black text-slate-900 mt-8 mb-4">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold text-slate-900 mt-6 mb-3">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold text-slate-900 mt-4 mb-2">$1</h3>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gm, '<pre class="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-sm overflow-x-auto my-4">$1</pre>');

    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-rose-600 rounded px-1.5 py-0.5 font-mono text-sm">$1</code>');

    // Blockquotes
    html = html.replace(/^\> (.*?)$/gm, '<blockquote class="border-l-4 border-indigo-500 pl-4 italic text-slate-600 my-4">$1</blockquote>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Lists
    html = html.replace(/^\- (.*?)$/gm, '<li class="list-disc list-inside text-slate-700 ml-4 mb-1">$1</li>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-indigo-600 hover:underline font-semibold">$1</a>');

    // Paragraphs
    const paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<li')) {
        return p;
      }
      return `<p class="text-slate-700 leading-relaxed mb-5 text-base sm:text-lg">${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const wordCount = post.content ? post.content.split(/\s+/).length : 100;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="bg-slate-50/50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to Articles</span>
        </button>

        {/* Blog Header Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <span className="bg-indigo-50 text-indigo-600 font-semibold text-xs px-3.5 py-1.5 rounded-full shadow-sm">
              {post.category}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              {post.title}
            </h1>
          </div>

          {/* Author Details */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-b border-slate-50 py-4">
            <div className="flex items-center gap-3">
              <img
                src={post.profiles?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                alt={post.profiles?.name}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-50"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">{post.profiles?.name}</p>
                <p className="text-xs text-slate-400 font-medium">@{post.profiles?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {readTime} min read</span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-slate-100">
            <img
              src={post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop'}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Content */}
          <article
            className="prose prose-indigo max-w-none prose-lg"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(post.content) }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4">
              {post.tags.map((tag, idx) => (
                <span key={idx} className="bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-bold border border-slate-100">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions Footer */}
          <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all border cursor-pointer ${liked ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-sm shadow-rose-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Heart className={`h-4.5 w-4.5 ${liked ? 'fill-rose-500' : ''}`} />
                <span>{likesCount}</span>
              </button>

              <button
                onClick={handleBookmark}
                className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all border cursor-pointer ${bookmarked ? 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Bookmark className={`h-4.5 w-4.5 ${bookmarked ? 'fill-indigo-600' : ''}`} />
                <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Share2 className="h-4.5 w-4.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-slate-900">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((p) => (
                <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-100/50 transition-all flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{p.category}</span>
                    <h3 className="font-bold text-base text-slate-900 mt-3 hover:text-indigo-600 transition-colors line-clamp-2">
                      <Link to={`/posts/${p.slug}`}>{p.title}</Link>
                    </h3>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 mt-4 pt-3 text-xs text-slate-400 font-bold">
                    <span>By {p.profiles?.name}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discussion Section */}
        <CommentSection postId={post.id} />

      </div>
    </div>
  );
}
