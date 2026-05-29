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
      // Get role from profile
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      currentUser = { ...user, role: profile?.role || 'user' };
    }
  }

  try {
    // GET /api/posts
    if (req.method === 'GET') {
      const { id, slug, search, category, tag, author_id, status, sort, page = 1, limit = 10 } = req.query;

      // Fetch single post
      if (id || slug) {
        let query = supabase.from('posts').select('*, profiles:author_id(*)');
        if (id) query = query.eq('id', id);
        if (slug) query = query.eq('slug', slug);

        const { data: post, error } = await query.maybeSingle();
        if (error) throw error;
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Increment views
        await supabase.rpc('increment_post_views', { post_id: post.id }).catch(async () => {
          // Fallback if RPC doesn't exist
          await supabase.from('posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id);
        });

        // Get total likes and comments count
        const { count: likesCount } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
        const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);

        let isLiked = false;
        let isBookmarked = false;

        if (currentUser) {
          const { data: like } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle();
          const { data: bookmark } = await supabase.from('bookmarks').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle();
          isLiked = !!like;
          isBookmarked = !!bookmark;
        }

        return res.status(200).json({
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked: isLiked,
          is_bookmarked: isBookmarked
        });
      }

      // Fetch list of posts
      let query = supabase.from('posts').select('*, profiles:author_id(*)', { count: 'exact' });

      // Apply filters
      query = query.eq('is_deleted', false);

      // Status filter: Non-admins can only see published posts. Admins can see draft/published.
      if (currentUser?.role === 'admin') {
        if (status) query = query.eq('status', status);
      } else {
        query = query.eq('status', 'published');
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (author_id) {
        query = query.eq('author_id', author_id);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      if (tag) {
        query = query.contains('tags', JSON.stringify([tag]));
      }

      // Apply sorting
      if (sort === 'trending') {
        query = query.order('views', { ascending: false });
      } else if (sort === 'popular') {
        query = query.order('likes_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (parseInt(page) - 1) * parseInt(limit);
      const to = from + parseInt(limit) - 1;
      query = query.range(from, to);

      const { data: posts, count, error } = await query;
      if (error) throw error;

      // Add like/bookmark info for the post list
      const enrichedPosts = await Promise.all((posts || []).map(async (post) => {
        let isLiked = false;
        let isBookmarked = false;

        if (currentUser) {
          const { data: like } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle();
          const { data: bookmark } = await supabase.from('bookmarks').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle();
          isLiked = !!like;
          isBookmarked = !!bookmark;
        }

        const { count: likesCount } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
        const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);

        return {
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked: isLiked,
          is_bookmarked: isBookmarked
        };
      }));

      return res.status(200).json({
        posts: enrichedPosts,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      });
    }

    // POST /api/posts - Create Post or toggle like/bookmark
    if (req.method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

      const { action, id: targetId } = req.query;

      // Toggle Like
      if (action === 'like') {
        if (!targetId) return res.status(400).json({ error: 'Post ID is required' });
        const { data: existingLike, error: likeCheckError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', targetId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (likeCheckError) throw likeCheckError;

        if (existingLike) {
          await supabase.from('post_likes').delete().eq('id', existingLike.id);
          // Decrement post likes_count
          const { data: post } = await supabase.from('posts').select('likes_count').eq('id', targetId).maybeSingle();
          await supabase.from('posts').update({ likes_count: Math.max(0, (post?.likes_count || 1) - 1) }).eq('id', targetId);
          return res.status(200).json({ liked: false });
        } else {
          await supabase.from('post_likes').insert({ post_id: targetId, user_id: currentUser.id });
          // Increment post likes_count
          const { data: post } = await supabase.from('posts').select('likes_count').eq('id', targetId).maybeSingle();
          await supabase.from('posts').update({ likes_count: (post?.likes_count || 0) + 1 }).eq('id', targetId);
          return res.status(200).json({ liked: true });
        }
      }

      // Toggle Bookmark
      if (action === 'bookmark') {
        if (!targetId) return res.status(400).json({ error: 'Post ID is required' });
        const { data: existingBookmark, error: bmCheckError } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('post_id', targetId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (bmCheckError) throw bmCheckError;

        if (existingBookmark) {
          await supabase.from('bookmarks').delete().eq('id', existingBookmark.id);
          return res.status(200).json({ bookmarked: false });
        } else {
          await supabase.from('bookmarks').insert({ post_id: targetId, user_id: currentUser.id });
          return res.status(200).json({ bookmarked: true });
        }
      }

      // Standard Create Post
      const { title, content, featured_image, category, tags = [], status = 'published' } = req.body;
      if (!title || !content || !category) {
        return res.status(400).json({ error: 'Title, content, and category are required' });
      }

      // Generate unique slug
      let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const { data: duplicate } = await supabase.from('posts').select('id').eq('slug', slug).maybeSingle();
      if (duplicate) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          title,
          slug,
          content,
          featured_image: featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop',
          author_id: currentUser.id,
          category,
          tags,
          status,
          views: 0,
          likes_count: 0,
          is_deleted: false
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(post);
    }

    // PUT /api/posts - Edit Post
    if (req.method === 'PUT') {
      if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Post ID is required' });

      // Check ownership or admin status
      const { data: postCheck, error: checkError } = await supabase.from('posts').select('author_id').eq('id', id).maybeSingle();
      if (checkError) throw checkError;
      if (!postCheck) return res.status(404).json({ error: 'Post not found' });

      if (postCheck.author_id !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to edit this post' });
      }

      const { title, content, featured_image, category, tags, status } = req.body;
      const updateData = {};
      if (title) {
        updateData.title = title;
        updateData.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + id;
      }
      if (content) updateData.content = content;
      if (featured_image) updateData.featured_image = featured_image;
      if (category) updateData.category = category;
      if (tags) updateData.tags = tags;
      if (status) updateData.status = status;

      const { data: updatedPost, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(updatedPost);
    }

    // DELETE /api/posts - Delete Post (soft delete)
    if (req.method === 'DELETE') {
      if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Post ID is required' });

      const { data: postCheck, error: checkError } = await supabase.from('posts').select('author_id').eq('id', id).maybeSingle();
      if (checkError) throw checkError;
      if (!postCheck) return res.status(404).json({ error: 'Post not found' });

      if (postCheck.author_id !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to delete this post' });
      }

      // Hard delete from DB to keep clean, or soft-delete. Let's do soft delete:
      const { error } = await supabase.from('posts').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Post soft-deleted successfully' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Posts API error:', err);
    res.status(500).json({ error: err.message });
  }
}
