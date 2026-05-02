-- Fix infinite recursion in org RLS policies
-- organizations → org_members → organizations was circular

-- Break the cycle: use profiles.org_id instead of querying org_members
DROP POLICY IF EXISTS "org_member_select" ON organizations;
CREATE POLICY "org_member_select" ON organizations FOR SELECT USING (
  id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND org_id IS NOT NULL)
);

-- Also fix org_members select: owner check referenced organizations which referenced org_members
DROP POLICY IF EXISTS "org_members_select" ON org_members;
CREATE POLICY "org_members_select" ON org_members FOR SELECT USING (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "org_owner_manage_members" ON org_members;
CREATE POLICY "org_owner_manage_members" ON org_members FOR ALL USING (
  org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
