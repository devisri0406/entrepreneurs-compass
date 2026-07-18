-- Security Hardening: SECURITY DEFINER Function Protection
-- This migration ensures the has_role() function cannot be exploited for privilege escalation

-- IMPORTANT: Run this in your Supabase SQL Editor (https://app.supabase.com)
-- DO NOT run via migration system if it breaks your deployment

-- Step 1: Secure the has_role() function to only check auth.uid()
-- This function should validate that users can only check their own roles
CREATE OR REPLACE FUNCTION has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = role_name
  );
$$;

-- Step 2: Revoke dangerous EXECUTE permissions on has_role if it exists
-- Only authenticated users should be able to call it via RLS policies
REVOKE EXECUTE ON FUNCTION has_role(text) FROM anon;

-- Step 3: Add RLS policy to user_roles table to prevent reading other users' roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can only view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON user_roles;

-- Create secure policies
CREATE POLICY "Users can only view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Only admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY "Only admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY "Only admins can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- Step 4: Create audit function to log role changes
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id uuid NOT NULL,
  role text,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policy: users can only view their own entries, admins see all
CREATE POLICY "Users can view own audit logs"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role('admin'));

-- Log role grants
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO admin_audit_log (action, user_id, role, changed_by)
    VALUES ('role_granted', NEW.user_id, NEW.role, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO admin_audit_log (action, user_id, role, changed_by)
    VALUES ('role_revoked', OLD.user_id, OLD.role, auth.uid());
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_role_changes
AFTER INSERT OR DELETE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION log_role_change();
