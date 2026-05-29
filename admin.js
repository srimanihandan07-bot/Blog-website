import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    // Verify Admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    const { action } = req.query;

    // GET /api/admin?action=stats
    if (req.method === 'GET' && action === 'stats') {
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: totalPosts } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_deleted', false);
      const { count: totalComments } = await supabase.from('comments').select('*', { count: 'exact', head: true });

      // Calculate total views
      const { data: postsViews } = await supabase.from('posts').select('views').eq('is_deleted', false);
      const totalViews = (postsViews || []).reduce((acc, p) => acc + (p.views || 0), 0);

      // Active users (posted or commented in the last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeAuthors } = await supabase.from('posts').select('author_id').gte('created_at', thirtyDaysAgo);
      const { data: activeCommenters } = await supabase.from('comments').select('user_id').gte('created_at', thirtyDaysAgo);

      const activeUserIds = new Set([
        ...(activeAuthors || []).map(a => a.author_id),
        ...(activeCommenters || []).map(c => c.user_id)
      ]);

      return res.status(200).json({
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalViews: totalViews || 0,
        activeUsers: activeUserIds.size || 0
      });
    }

    // GET /api/admin?action=users
    if (req.method === 'GET' && action === 'users') {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(users);
    }

    // GET /api/admin?action=posts
    if (req.method === 'GET' && action === 'posts') {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*, profiles:author_id(*)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(posts);
    }

    // PUT /api/admin?action=update-user
    if (req.method === 'PUT' && action === 'update-user') {
      const { userId, role, is_banned } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID is required' });

      const updateFields = {};
      if (role) updateFields.role = role;
      if (typeof is_banned === 'boolean') updateFields.bio = is_banned ? '[BANNED] ' + (req.body.bio || '') : (req.body.bio || '').replace('[BANNED] ', ''); // simple ban flag in bio or custom field. Let's add role/ban support.

      // Let's update role
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateFields)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(updatedProfile);
    }

    // DELETE /api/admin?action=delete-post
    if (req.method === 'DELETE' && action === 'delete-post') {
      const { postId } = req.body;
      if (!postId) return res.status(400).json({ error: 'Post ID is required' });

      const { error } = await supabase.from('posts').update({ is_deleted: true }).eq('id', postId);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // DELETE /api/admin?action=delete-comment
    if (req.method === 'DELETE' && action === 'delete-comment') {
      const { commentId } = req.body;
      if (!commentId) return res.status(400).json({ error: 'Comment ID is required' });

      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin API error:', err);
    res.status(500).json({ error: err.message });
  }
}
