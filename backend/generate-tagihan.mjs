import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...value] = line.split('=');
    if (key) {
      envVars[key.trim()] = value.join('=').trim();
    }
  }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !serviceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const bulan = new Date().getMonth() + 1; // current month
  const tahun = new Date().getFullYear(); // current year
  
  console.log(`Generating tagihan for ${bulan}/${tahun}`);

  // 1. Get configs
  const { data: configs, error: configError } = await db.from('iuran_config').select('*').eq('is_active', true);
  if (configError) throw configError;
  if (!configs || configs.length === 0) {
    console.log('No active configs');
    return;
  }

  // 2. Get families
  const { data: keluargaList, error: keluargaError } = await db.from('keluarga').select('id');
  if (keluargaError) throw keluargaError;
  if (!keluargaList || keluargaList.length === 0) {
    console.log('No families found');
    return;
  }
  
  console.log(`Found ${configs.length} configs and ${keluargaList.length} families`);

  // 3. Get existing
  const { data: existingTagihan } = await db
    .from('tagihan_iuran')
    .select('keluarga_id, iuran_config_id')
    .eq('bulan', bulan)
    .eq('tahun', tahun);
    
  const existingSet = new Set((existingTagihan ?? []).map(t => `${t.keluarga_id}|${t.iuran_config_id}`));

  // 4. Build insert rows
  const insertRows = [];
  for (const config of configs) {
    for (const keluarga of keluargaList) {
      const key = `${keluarga.id}|${config.id}`;
      if (!existingSet.has(key)) {
        insertRows.push({
          keluarga_id: keluarga.id,
          iuran_config_id: config.id,
          bulan,
          tahun,
          nominal: config.nominal,
          status: 'belum_bayar',
        });
      }
    }
  }

  if (insertRows.length === 0) {
    console.log(`0 created, ${existingSet.size} skipped.`);
    return;
  }

  // 5. Insert
  const { data: inserted, error: insertError } = await db.from('tagihan_iuran').insert(insertRows).select('id');
  if (insertError) throw insertError;
  
  console.log(`Success! Created ${inserted?.length ?? 0} tagihan.`);
}

main().catch(console.error);
