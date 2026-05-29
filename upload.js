import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { fileName, fileBase64, contentType } = req.body;
    if (!fileName || !fileBase64 || !contentType) {
      return res.status(400).json({ error: 'Missing file details' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const path = `${user.id}/${Date.now()}-${fileName}`;

    // Upload to bucket
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(path, buffer, { contentType, upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(path);

    return res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('Upload API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
