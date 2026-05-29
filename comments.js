import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  let currentUser = null;

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token).catch(() => ({ data: {} }));
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      currentUser = { ...user, role: profile?.role || 'user' };
    }
  }

  try {
    // GET /api/comments?postId=123
    if (req.method === 'GET') {
      const { postId } = req.query;
      if (!postId) return res.status(400).json({ error: 'Post ID is required' });

      const { data: comments, error } = await supabase
        .from('comments')
        .select('*, profiles:user_id(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch likes count and user like status for each comment
      const enrichedComments = await Promise.all((comments || []).map(async (comment) => {
        const { count: likesCount } = await supabase.from('comment_likes').select('*', { count: 'exact', head: true }).eq('comment_id', comment.id);
        let isLiked = false;
        if (currentUser) {
          const { data: like } = await supabase.from('comment_likes').select('id').eq('comment_id', comment.id).eq('user_id', currentUser.id).maybeSingle();
          isLiked = !!like;
        }
        return {
          ...comment,
          likes_count: likesCount || 0,
          is_liked: isLiked
        };
      }));

      return res.status(200).json(enrichedComments);
    }

    // POST /api/comments
    if (req.method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

      const { action, id: targetId } = req.query;

      // Like Comment Action
      if (action === 'like') {
        if (!targetId) return res.status(400).json({ error: 'Comment ID is required' });
        const { data: existingLike } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', targetId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (existingLike) {
          await supabase.from('comment_likes').delete().eq('id', existingLike.id);
          const { data: comment } = await supabase.from('comments').select('likes_count').eq('id', targetId).maybeSingle();
          await supabase.from('comments').update({ likes_count: Math.max(0, (comment?.likes_count || 1) - 1) }).eq('id', targetId);
          return res.status(200).json({ liked: false });
        } else {
          await supabase.from('comment_likes').insert({ comment_id: targetId, user_id: currentUser.id });
          const { data: comment } = await supabase.from('comments').select('likes_count').eq('id', targetId).maybeSingle();
          await supabase.from('comments').update({ likes_count: (comment?.likes_count || 0) + 1 }).eq('id', targetId);
          return res.status(200).json({ liked: true });
        }
      }

      // Add Comment
      const { post_id, parent_comment_id, content } = req.body;
      if (!post_id || !content) {
        return res.status(400).json({ error: 'Post ID and content are required' });
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id,
          parent_comment_id: parent_comment_id || null,
          content,
          user_id: currentUser.id,
          likes_count: 0
        })
        .select('*, profiles:user_id(*)')
        .single();

      if (error) throw error;
      return res.status(201).json({ ...comment, likes_count: 0, is_liked: false });
    }

    // PUT /api/comments?id=123
    if (req.method === 'PUT') {
      if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.query;
      const { content } = req.body;
      if (!id || !content) return res.status(400).json({ error: 'Comment ID and content are required' });

      const { data: commentCheck } = await supabase.from('comments').select('user_id').eq('id', id).maybeSingle();
      if (!commentCheck) return res.status(404).json({ error: 'Comment not found' });

      if (commentCheck.user_id !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to edit this comment' });
      }

      const { data: updatedComment, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select('*, profiles:user_id(*)')
        .single();

      if (error) throw error;
      return res.status(200).json(updatedComment);
    }

    // DELETE /api/comments?id=123
    if (req.method === 'DELETE') {
      if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Comment ID is required' });

      const { data: commentCheck } = await supabase.from('comments').select('user_id').eq('id', id).maybeSingle();
      if (!commentCheck) return res.status(404).json({ error: 'Comment not found' });

      if (commentCheck.user_id !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to delete this comment' });
      }

      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Comments API error:', err);
    res.status(500).json({ error: err.message });
  }
}
