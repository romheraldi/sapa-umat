-- Add 'ketua_wilayah' to role_type enum
ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'ketua_wilayah';

-- Add ketua_id column to wilayah table
ALTER TABLE wilayah
ADD COLUMN IF NOT EXISTS ketua_id UUID REFERENCES users_roles(id) ON DELETE SET NULL;
