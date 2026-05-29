import { Link } from 'react-router-dom';
import { Eye, Heart, MessageSquare, Clock, Bookmark } from 'lucide-react';

export default function BlogCard({ post, onToggleBookmark }) {
  const {
    id,
    title,
    slug,
    featured_image,
    category,
    tags = [],
    views = 0,
    likes_count = 0,
    comments_count = 0,
    created_at,
    is_bookmarked,
    profiles
  } = post;

  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate read time
  const wordCount = post.content ? post.content.split(/\s+/).length : 100;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl hover:shadow-slate-100/80 transition-all duration-300 flex flex-col h-full group">
      {/* Featured Image */}
      <Link to={`/posts/${slug}`} className="relative block overflow-hidden aspect-[16/10]">
        <img
          src={featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/95 backdrop-blur-sm text-indigo-600 font-semibold text-xs px-3 py-1.5 rounded-full shadow-sm">
            {category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Author & Date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img
              src={profiles?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
              alt={profiles?.name || 'Author'}
              className="h-7 w-7 rounded-full object-cover"
            />
            <span className="text-xs font-semibold text-slate-700">{profiles?.name || 'Author'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>{readTime} min read</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-slate-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
          <Link to={`/posts/${slug}`}>{title}</Link>
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed flex-1">
          {post.content ? post.content.replace(/[#*`>_\-[\]()]/g, '') : ''}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="bg-slate-50 text-slate-500 text-xs px-2.5 py-1 rounded-md font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-auto">
          <span className="text-xs text-slate-400 font-medium">{formattedDate}</span>
          
          <div className="flex items-center gap-4 text-slate-500 font-medium text-xs">
            <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Eye className="h-4 w-4 text-slate-400" />
              <span>{views}</span>
            </span>
            <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Heart className="h-4 w-4 text-slate-400" />
              <span>{likes_count}</span>
            </span>
            <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <span>{comments_count}</span>
            </span>
            <button
              onClick={() => onToggleBookmark && onToggleBookmark(id)}
              className={`p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${is_bookmarked ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <Bookmark className={`h-4 w-4 ${is_bookmarked ? 'fill-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
