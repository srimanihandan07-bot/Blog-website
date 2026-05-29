import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name, bio, avatar, social_links } = req.body;

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        name,
        bio,
        avatar,
        social_links
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json(profile);
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: err.message });
  }
}
