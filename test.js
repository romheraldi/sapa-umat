const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase
    .from('keluarga')
    .select('id, no_kk_katolik, lingkungan(id, nama, wilayah(id, nama)), anggota:umat!umat_keluarga_id_fkey(id, nama_lengkap, user_id)')
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}
test();
