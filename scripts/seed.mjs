import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🌱 Starting SocialSentinel deterministic database seed...');

async function runSeed() {
  // 1. Seed Communities
  console.log('📌 Seeding topic communities...');
  const communities = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'AI & Tech',
      slug: 'ai-tech',
      icon: '⚡',
      description: 'Machine learning architectures, neural models, synthetic reasoning, explainable AI, and autonomous agent systems.',
      banner_gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      name: 'Cybersecurity & Privacy',
      slug: 'cybersecurity',
      icon: '🛡️',
      description: 'Defensive security architecture, zero-trust engineering, post-quantum cryptography, and user privacy preservation.',
      banner_gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      name: 'Web Engineering',
      slug: 'web-engineering',
      icon: '💻',
      description: 'Fullstack system design, Next.js App Router, edge runtimes, distributed caching, and web performance optimization.',
      banner_gradient: 'linear-gradient(135deg, #3b82f6, #10b981)',
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      name: 'Creative Tech & Design',
      slug: 'creative-tech',
      icon: '🎨',
      description: 'Generative design systems, procedural art, micro-interactions, responsive typography, and creative frontends.',
      banner_gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      name: 'Digital Wellbeing',
      slug: 'digital-wellbeing',
      icon: '🌿',
      description: 'Calm computing, human-centered feed ergonomics, mindful digital habits, and intentional social networking.',
      banner_gradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
    },
  ];

  for (const c of communities) {
    const { error } = await supabase.from('communities').upsert(c, { onConflict: 'slug' });
    if (error) console.warn(`Notice on community ${c.name}: ${error.message}`);
  }
  console.log('✅ Topic communities verified.');

  console.log('✨ Database seeding routine finished.');
  console.log('👉 To apply the complete 35-profile and 130-post relational seed with foreign keys, execute supabase/seed.sql in your Supabase SQL editor.');
}

runSeed().catch(console.error);
