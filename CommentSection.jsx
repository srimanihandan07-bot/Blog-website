import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Reply, Trash2, Edit3, MessageSquare, Send } from 'lucide-react';

export default function CommentSection({ postId }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAddComment = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    try {
      const token = (await fetchToken()) || '';
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          post_id: postId,
          parent_comment_id: parentId,
          content
        })
      });

      if (res.ok) {
        if (parentId) {
          setReplyContent('');
          setReplyingTo(null);
        } else {
          setNewComment('');
        }
        fetchComments();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleEditComment = async (e, commentId) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      const token = (await fetchToken()) || '';
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      });

      if (res.ok) {
        setEditingComment(null);
        setEditContent('');
        fetchComments();
      }
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = (await fetchToken()) || '';
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      alert('Please sign in to like comments!');
      return;
    }

    try {
      const token = (await fetchToken()) || '';
      const res = await fetch(`/api/comments?action=like&id=${commentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const fetchToken = async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const session = await client.auth.getSession();
    return session.data.session?.access_token;
  };

  // Build comments tree
  const rootComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  const renderComment = (comment, isReply = false) => {
    const isOwner = user && comment.user_id === user.id;
    const isAdmin = profile?.role === 'admin';
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={`mt-6 ${isReply ? 'ml-8 sm:ml-12 pl-4 border-l-2 border-slate-100' : ''}`}>
        <div className="flex gap-3">
          <img
            src={comment.profiles?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
            alt={comment.profiles?.name}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100"
          />
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-slate-800">{comment.profiles?.name}</span>
                <span className="text-xs text-slate-400 ml-2">
                  {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {(isOwner || isAdmin) && (
                  <>
                    <button
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Comment Content */}
            {editingComment === comment.id ? (
              <form onSubmit={(e) => handleEditComment(e, comment.id)} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                />
                <button type="submit" className="bg-indigo-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">Save</button>
                <button type="button" onClick={() => setEditingComment(null)} className="border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
              </form>
            ) : (
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">{comment.content}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${comment.is_liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
              >
                <Heart className={`h-3.5 w-3.5 ${comment.is_liked ? 'fill-rose-500' : ''}`} />
                <span>{comment.likes_count}</span>
              </button>

              {!isReply && user && (
                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    setReplyContent('');
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Reply className="h-3.5 w-3.5" />
                  <span>Reply</span>
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <form onSubmit={(e) => handleAddComment(e, comment.id)} className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Reply
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="mt-12 bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-indigo-500" />
        <span>Discussion ({comments.length})</span>
      </h3>

      {/* Main Comment Input */}
      {user ? (
        <form onSubmit={(e) => handleAddComment(e)} className="flex gap-3 mb-8">
          <img
            src={profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
            alt="My Avatar"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-50"
          />
          <div className="flex-1 flex gap-2">
            <textarea
              placeholder="What are your thoughts on this article?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              rows={2}
              className="bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 resize-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center mb-8">
          <p className="text-sm text-slate-600 font-medium">Please sign in to join the discussion.</p>
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
          <div className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
        </div>
      ) : rootComments.length > 0 ? (
        <div className="divide-y divide-slate-50">
          {rootComments.map(c => renderComment(c))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-6">No comments yet. Be the first to start the discussion!</p>
      )}
    </div>
  );
}
