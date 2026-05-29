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
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // unique violation
        return res.status(200).json({ success: true, message: 'Already subscribed!' });
      }
      throw error;
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Newsletter subscription error:', err);
    return res.status(500).json({ error: err.message });
  }
}
