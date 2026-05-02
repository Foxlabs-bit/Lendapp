-- =============================================
-- LEND APP — Org Plan Migrations
-- Run AFTER supabase-migrations.sql
-- https://supabase.com/dashboard/project/nunygjzicawqvskxnawf/sql
-- =============================================

-- Add 'org' to plan_tier enum
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'org';

-- New enums
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'user');
CREATE TYPE member_status AS ENUM ('pending', 'active', 'suspended');

-- Organizations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  join_code text NOT NULL UNIQUE,
  seat_limit int NOT NULL DEFAULT 5,
  square_customer_id text,
  square_subscription_id text,
  plan_activated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Org Members
CREATE TABLE org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'user',
  status member_status NOT NULL DEFAULT 'pending',
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Add org fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS org_role org_role;

-- Add type + metadata to notifications for org join requests
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'general';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Triggers
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_owner_all" ON organizations FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "org_member_select" ON organizations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = organizations.id AND user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_members_select" ON org_members FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND owner_id = auth.uid())
);

CREATE POLICY "org_owner_manage_members" ON org_members FOR ALL USING (
  EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND owner_id = auth.uid())
);

CREATE POLICY "org_member_join_request" ON org_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "org_member_leave" ON org_members FOR DELETE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE org_members;
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
