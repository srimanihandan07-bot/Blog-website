import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing to avoid depending on dotenv
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
    }
  } catch (err) {
    console.error('Failed to load .env file:', err);
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('Starting database seeding...');

  // 1. Create or find Admin User
  let adminId;
  const adminEmail = 'admin@example.com';
  console.log(`Checking/Creating Auth User: ${adminEmail}`);
  
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: 'password123',
    email_confirm: true,
    user_metadata: { name: 'Admin Moderator', username: 'admin' }
  });

  if (adminAuthError) {
    if (adminAuthError.message.includes('already exists') || adminAuthError.status === 422) {
      console.log('Admin user already exists in Auth. Fetching ID...');
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const found = users.users.find(u => u.email === adminEmail);
      if (found) adminId = found.id;
    } else {
      throw adminAuthError;
    }
  } else {
    adminId = adminAuth.user.id;
  }

  console.log(`Admin ID: ${adminId}`);

  // 2. Create or find Demo User
  let demoId;
  const demoEmail = 'demo@example.com';
  console.log(`Checking/Creating Auth User: ${demoEmail}`);

  const { data: demoAuth, error: demoAuthError } = await supabase.auth.admin.createUser({
    email: demoEmail,
    password: 'password123',
    email_confirm: true,
    user_metadata: { name: 'Alex Developer', username: 'alex_dev' }
  });

  if (demoAuthError) {
    if (demoAuthError.message.includes('already exists') || demoAuthError.status === 422) {
      console.log('Demo user already exists in Auth. Fetching ID...');
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const found = users.users.find(u => u.email === demoEmail);
      if (found) demoId = found.id;
    } else {
      throw demoAuthError;
    }
  } else {
    demoId = demoAuth.user.id;
  }

  console.log(`Demo User ID: ${demoId}`);

  // 3. Insert Profiles
  console.log('Inserting profiles...');
  const profiles = [
    {
      id: adminId,
      name: 'Admin Moderator',
      username: 'admin',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
      bio: 'Lead architect and platform moderator for DesignArena. Writing about web security, database performance, and modern developer workflows.',
      role: 'admin',
      social_links: { twitter: 'designarena', github: 'designarena', linkedin: 'designarena' }
    },
    {
      id: demoId,
      name: 'Alex Developer',
      username: 'alex_dev',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alex_dev',
      bio: 'Full-stack software engineer loving React, TypeScript, and Tailwind CSS. Sharing tutorials, design guidelines, and tech trend analysis.',
      role: 'user',
      social_links: { twitter: 'alex_dev', github: 'alex_dev', linkedin: 'alex_dev' }
    }
  ];

  for (const prof of profiles) {
    const { error: profError } = await supabase
      .from('profiles')
      .upsert(prof, { onConflict: 'id' });
    if (profError) throw profError;
  }
  console.log('Profiles upserted successfully.');

  // 4. Insert Blog Posts
  console.log('Inserting blog posts...');
  const posts = [
    {
      title: 'Mastering Tailwind CSS v4 in React 19',
      slug: 'mastering-tailwindcss-v4-in-react-19',
      content: `# The Next Generation of Styling\n\nTailwind CSS v4 introduces an entirely redesigned pipeline built for speed, native CSS variables, and zero-configuration setups. Paired with React 19, it unlocks incredible potential for web development.\n\n## Why Tailwind CSS v4 is a Game Changer\n\n1. **Lightning Fast Build Times**: Built on a new Rust-based engine, v4 is up to 10x faster than v3.\n2. **First-class CSS Variables**: No more complex configuration files. Customize themes directly in your CSS files using standard CSS variables!\n3. **Simplified Directives**: Forget about multiple \`@tailwind\` directives; everything is imported cleanly using a single \`@import "tailwindcss";\` statement.\n\n## Let's Look at Code\n\n\`\`\`javascript\nimport React from 'react';\n\nexport default function Button() {\n  return (\n    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-100">\n      Click Me\n    </button>\n  );\n}\n\`\`\`\n\n## Conclusion\n\nTransitioning to Tailwind v4 is highly recommended for all production applications. Its performance boosts and simplified developer experience are unmatched.`,
      featured_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop',
      author_id: demoId,
      category: 'Development',
      tags: ['react', 'tailwindcss', 'webdev'],
      views: 142,
      likes_count: 12,
      status: 'published',
      is_deleted: false,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: 'Building Scalable API Architectures with Node.js',
      slug: 'building-scalable-api-architectures-with-nodejs',
      content: `# Design Patterns for Modern Backends\n\nCreating a production-ready API is more than just writing route handlers. It requires careful planning of data flows, error boundaries, security features, and database resilience.\n\n## Key Architectural Pillars\n\n- **Folder Separation**: Keep controllers, models, and routes distinct.\n- **CORS & Helmet Security**: Prevent unauthenticated origins and common headers exploitation.\n- **Database Resilience**: Implement auto-reconnection and database wake-up routines for serverless deployment.\n- **Global Error Handling**: Catch uncaught exceptions and return uniform JSON responses.\n\n## Example Route Handler\n\n\`\`\`javascript\nexport default async function handler(req, res) {\n  try {\n    const data = await fetchItems();\n    res.status(200).json(data);\n  } catch (err) {\n    res.status(500).json({ error: err.message });\n  }\n}\n\`\`\`\n\n## Summary\n\nDesigning with these patterns ensures that your application is scalable, maintainable, and robust against high traffic.`,
      featured_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop',
      author_id: adminId,
      category: 'Technology',
      tags: ['javascript', 'database', 'webdev'],
      views: 289,
      likes_count: 24,
      status: 'published',
      is_deleted: false,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: 'The Principles of High-Converting UI/UX Design',
      slug: 'the-principles-of-high-converting-uiux-design',
      content: `# Designing for Users and Conversion\n\nA beautiful website is useless if users can't navigate it. UI/UX design is a science that combines visual hierarchy, cognitive load reduction, and emotional resonance.\n\n## Core Principles\n\n1. **Visual Hierarchy**: Guide the user's eyes to the most important element first.\n2. **Whitespace is Luxury**: Give elements breathing room to reduce cognitive fatigue.\n3. **Consistency**: Keep buttons, typography, and menus consistent across all pages.\n4. **Feedback & Micro-interactions**: Provide instant feedback when users click a button or submit a form.\n\n## Practical Tips\n\n- Use large, bold font weights for headlines and clean sans-serif for body text.\n- Stick to a cohesive color palette: 60% dominant color, 30% secondary, and 10% accent color.\n- Always test on mobile first! Mobile-first design is no longer optional.\n\n## Final Words\n\nGreat design is invisible. When a user completes their goal effortlessly, your design has succeeded.`,
      featured_image: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop',
      author_id: demoId,
      category: 'Design',
      tags: ['uiux', 'design', 'productivity'],
      views: 95,
      likes_count: 8,
      status: 'published',
      is_deleted: false,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const post of posts) {
    // Check if post already exists
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', post.slug)
      .maybeSingle();

    if (!existing) {
      const { error: postError } = await supabase
        .from('posts')
        .insert(post);
      if (postError) throw postError;
    }
  }
  console.log('Posts upserted successfully.');

  // 5. Insert Comments
  console.log('Inserting seed comments...');
  const { data: seededPosts } = await supabase.from('posts').select('id, slug');
  const postMap = {};
  seededPosts.forEach(p => { postMap[p.slug] = p.id; });

  const comments = [
    {
      user_id: adminId,
      post_id: postMap['mastering-tailwindcss-v4-in-react-19'],
      content: 'This is an excellent write-up on Tailwind v4! The Rust-based build pipeline is incredibly fast. Direct CSS variable customisation is definitely a game-changer.',
      likes_count: 4,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: demoId,
      post_id: postMap['building-scalable-api-architectures-with-nodejs'],
      content: 'Agreed! The database resilience pattern you mentioned is crucial, especially when deploying serverless functions that can suffer from cold starts or database pauses.',
      likes_count: 6,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const comm of comments) {
    if (!comm.post_id) continue;
    // Check if comment already exists
    const { data: existing } = await supabase
      .from('comments')
      .select('id')
      .eq('content', comm.content)
      .maybeSingle();

    if (!existing) {
      const { error: commError } = await supabase
        .from('comments')
        .insert(comm);
      if (commError) throw commError;
    }
  }
  console.log('Comments upserted successfully.');

  console.log('Database Seeding Completed Successfully!');
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
