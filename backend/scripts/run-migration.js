#!/usr/bin/env node
/**
 * Run the database migration against Supabase.
 * This uses the Management API to execute SQL directly.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pilzbulitvkdqsbzehmb.supabase.co';
const PROJECT_REF = 'pilzbulitvkdqsbzehmb';

// Read service role key from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const SERVICE_KEY = serviceKeyMatch ? serviceKeyMatch[1].trim() : '';

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

// Read migration SQL
const sqlPath = path.join(__dirname, '../supabase/migrations/20260609000000_add_dokumen_and_registration.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

// Remove comments for cleaner execution
const cleanSql = sql
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
  .join('\n');

async function runMigration() {
  console.log('🚀 Running migration via Supabase Management API...');
  console.log(`📍 Project: ${PROJECT_REF}`);
  console.log(`📄 SQL length: ${cleanSql.length} chars\n`);

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: cleanSql }),
      }
    );

    const text = await response.text();
    
    if (response.ok) {
      console.log('✅ Migration applied successfully!');
      console.log(text);
    } else {
      console.log(`❌ Migration failed (${response.status}):`);
      console.log(text);
      
      // Try splitting by statements and running individually
      console.log('\n🔄 Trying statement-by-statement...');
      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        const firstLine = stmt.split('\n')[0].substring(0, 60);
        
        const r = await fetch(
          `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({ query: stmt }),
          }
        );
        
        const t = await r.text();
        if (r.ok) {
          console.log(`  ✅ [${i + 1}/${statements.length}] ${firstLine}`);
        } else {
          const errData = JSON.parse(t || '{}');
          // Ignore "already exists" errors (idempotent)
          if (t.includes('already exists') || t.includes('duplicate')) {
            console.log(`  ⚠️  [${i + 1}/${statements.length}] Already exists: ${firstLine}`);
          } else {
            console.log(`  ❌ [${i + 1}/${statements.length}] FAILED: ${firstLine}`);
            console.log(`     Error: ${errData.message || t}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }
}

runMigration();
