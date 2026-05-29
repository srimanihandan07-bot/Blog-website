import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    // If profile doesn't exist for some reason, create it
    let finalProfile = profile;
    if (!profile) {
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || username,
          username,
          avatar,
          bio: '',
          role: 'user',
          social_links: {}
        })
        .select()
        .single();
      if (newProfileError) throw newProfileError;
      finalProfile = newProfile;
    }

    return res.status(200).json({
      session: data.session,
      user: data.user,
      profile: finalProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
}
