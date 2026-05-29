import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BlogCard from '../components/BlogCard';
import { Search, ChevronRight, TrendingUp, Filter, Heart, Eye } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [categories] = useState(['Technology', 'Development', 'Design', 'Tutorials', 'Marketing']);
  const [tags] = useState(['react', 'javascript', 'tailwindcss', 'webdev', 'productivity', 'uiux', 'database']);
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedTag) params.append('tag', selectedTag);
      if (sort) params.append('sort', sort);
      params.append('page', page.toString());
      params.append('limit', '6');

      // Fetch normal list
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotalPages(data.pages || 1);
      }

      // Fetch trending posts
      const trendRes = await fetch('/api/posts?sort=trending&limit=3');
      if (trendRes.ok) {
        const trendData = await trendRes.json();
        setTrendingPosts(trendData.posts || []);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search, selectedCategory, selectedTag, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ search, category: selectedCategory, tag: selectedTag, sort, page: '1' });
    setPage(1);
  };

  const handleCategoryClick = (cat) => {
    const nextCat = selectedCategory === cat ? '' : cat;
    setSelectedCategory(nextCat);
    setSearchParams({ search, category: nextCat, tag: selectedTag, sort, page: '1' });
    setPage(1);
  };

  const handleTagClick = (tag) => {
    const nextTag = selectedTag === tag ? '' : tag;
    setSelectedTag(nextTag);
    setSearchParams({ search, category: selectedCategory, tag: nextTag, sort, page: '1' });
    setPage(1);
  };

  const handleToggleBookmark = async (postId) => {
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

      const res = await fetch(`/api/posts?action=bookmark&id=${postId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-100 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <span className="bg-indigo-50 text-indigo-600 font-semibold text-xs px-4 py-2 rounded-full shadow-sm">
            Welcome to DesignArena Blog
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none max-w-4xl mx-auto">
            Discover the World of <span className="text-indigo-600">Design & Tech</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            High-quality blogs, comprehensive coding tutorials, and industry insights written by developers, for developers.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles, tags, authors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </section>

      {/* Trending Posts Section */}
      {trendingPosts.length > 0 && !selectedCategory && !selectedTag && !search && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <span>Trending Articles</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{post.category}</span>
                  <h3 className="font-bold text-base text-slate-900 mt-3 hover:text-indigo-600 transition-colors line-clamp-2">
                    <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-2 font-medium">
                    <span>By {post.profiles?.name}</span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 mt-4 pt-3 text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {post.views} views</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post.likes_count} likes</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content: Filters + Blog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Filter className="h-4.5 w-4.5 text-indigo-500" />
                <span>Categories</span>
              </h3>
              <div className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between cursor-pointer ${selectedCategory === cat ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <span>{cat}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Cloud */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h3 className="font-bold text-slate-900">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Blog Listing Grid */}
          <div className="lg:col-span-3 space-y-8">
            {/* Header / Sort Options */}
            <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-6 py-4">
              <span className="text-sm font-semibold text-slate-600">
                {loading ? 'Searching...' : `${posts.length} articles found`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setSearchParams({ search, category: selectedCategory, tag: selectedTag, sort: e.target.value, page: '1' });
                    setPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="latest">Latest</option>
                  <option value="trending">Trending</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
                    <div className="aspect-[16/10] bg-slate-100 rounded-xl"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
                <p className="text-slate-400 font-semibold text-lg">No posts matching your criteria.</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                    setSelectedTag('');
                    setSearchParams({});
                    setPage(1);
                  }}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPage(i + 1);
                      setSearchParams({ search, category: selectedCategory, tag: selectedTag, sort, page: (i + 1).toString() });
                    }}
                    className={`h-10 w-10 rounded-xl font-bold text-sm cursor-pointer transition-all ${page === i + 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
