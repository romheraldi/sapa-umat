const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createFirstAdmin() {
  const email = 'admin@paroki.or.id';
  const password = 'password123';
  
  console.log(`⏳ Creating admin user: ${email}...`);
  
  // 1. Create user in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log(`⚠️ User ${email} already exists in auth.users. Fetching ID...`);
      // User might already exist, we'll try to find their ID or just update role if we know it
      // For simplicity, we just print a message
      console.log("Please delete the user from Supabase Dashboard first, or use a different email.");
      return;
    } else {
      console.error("❌ Error creating auth user:", authError.message);
      return;
    }
  }
  
  const userId = authData.user.id;
  console.log(`✅ Auth user created with ID: ${userId}`);
  
  // 2. Set role as admin_paroki in users_roles table
  const { error: roleError } = await supabase
    .from('users_roles')
    .insert({
      id: userId,
      role: 'admin_paroki'
    });
    
  if (roleError) {
    // If it fails, maybe the trigger already created a row, so let's update it
    const { error: updateError } = await supabase
      .from('users_roles')
      .update({ role: 'admin_paroki' })
      .eq('id', userId);
      
    if (updateError) {
      console.error("❌ Error setting admin role:", updateError.message);
      return;
    }
  }
  
  console.log(`✅ Successfully assigned 'admin_paroki' role!`);
  console.log(`\n🎉 You can now log in to the backend using:\n Email: ${email}\n Password: ${password}`);
}

createFirstAdmin();
