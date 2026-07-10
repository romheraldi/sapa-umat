-- ============================================================
-- Migration: Add dokumen_umat table + nama_lengkap in users_roles
-- Date: 2026-06-09
-- ============================================================

-- Add nama_lengkap to users_roles for display purposes after registration
ALTER TABLE users_roles
  ADD COLUMN IF NOT EXISTS nama_lengkap VARCHAR(255),
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW();

-- Table: dokumen_umat
-- Stores metadata for PDF documents uploaded by umat
CREATE TABLE IF NOT EXISTS dokumen_umat (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users_roles(id) ON DELETE CASCADE,
  judul        VARCHAR(255) NOT NULL,
  kategori     VARCHAR(100) NOT NULL DEFAULT 'Umum',
  file_path    TEXT NOT NULL,           -- Storage path: dokumen-umat/{user_id}/{filename}
  file_name    VARCHAR(255) NOT NULL,   -- Original filename for display
  file_size    BIGINT,                  -- File size in bytes
  keterangan   TEXT,
  status       VARCHAR(50) NOT NULL DEFAULT 'aktif',  -- aktif | arsip
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_dokumen_umat_user_id ON dokumen_umat(user_id);
CREATE INDEX IF NOT EXISTS idx_dokumen_umat_created_at ON dokumen_umat(created_at DESC);

-- ─── RLS Policies for dokumen_umat ────────────────────────────────────────────

ALTER TABLE dokumen_umat ENABLE ROW LEVEL SECURITY;

-- Umat can only see their own documents
CREATE POLICY "Umat can view own documents"
  ON dokumen_umat FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Umat can insert their own documents
CREATE POLICY "Umat can insert own documents"
  ON dokumen_umat FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Umat can delete their own documents
CREATE POLICY "Umat can delete own documents"
  ON dokumen_umat FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Umat can update their own documents
CREATE POLICY "Umat can update own documents"
  ON dokumen_umat FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can see all documents (handled by service_role key on backend, no RLS bypass needed)
-- The backend API will use admin client for admin endpoints

-- ─── Storage Bucket (run manually in Supabase dashboard or via SQL editor) ────
-- NOTE: Supabase Storage buckets cannot be created via SQL migration.
-- Please create the bucket 'dokumen-umat' manually in the Supabase dashboard:
--   Storage → New Bucket → Name: dokumen-umat → Private (unchecked for now, RLS will protect)
-- Then add these storage policies via the dashboard or Supabase CLI.
