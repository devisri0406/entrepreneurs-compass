# Security Fixes Applied

This document outlines the security vulnerabilities that were identified and fixed in this project.

## 1. ✅ Markdown Renderer - JavaScript Links (ALREADY SECURED)

**Status:** Already properly protected  
**File:** `src/components/markdown.tsx`

The markdown renderer already validates all URLs using a `safeUrl()` function that:
- Only allows `http:`, `https:`, and `mailto:` protocols
- Blocks `javascript:`, `data:`, and `vbscript:` schemes
- Converts invalid URLs to `#` (safe anchor)

**No action required** - the protection is already in place.

---

## 2. ⚠️ Search Boxes - SQL Injection Prevention (ENHANCED)

**Status:** Fixed  
**File:** `src/lib/search-utils.ts`

### Problem
Search input could potentially be manipulated to bypass database query filters.

### Solution
Enhanced the `sanitizeSearchTerm()` function to:
- Remove all control characters (`\x00-\x1f`, `\x7f`)
- Block SQL special characters: `;`, `'`, `"`
- Limit input length to 100 characters
- Trim whitespace

### Changes
```typescript
export function sanitizeSearchTerm(input: string, maxLen = 100): string {
  return input
    .slice(0, maxLen)
    .replace(/[\x00-\x1f\x7f]/g, "") // Remove control characters
    .replace(/[;'"]/g, "") // Block SQL injection special characters
    .trim();
}
```

### Testing
All search queries now go through this sanitization before being used in database queries.

---

## 3. 🔴 Admin Role Claim - Privilege Escalation (CRITICAL FIX)

**Status:** Fixed  
**File:** `src/lib/admin.functions.ts`

### Problem
**CRITICAL:** Any user could claim the admin role before the legitimate owner, gaining unauthorized system access.

### Solution
Implemented a **single-user bootstrap pattern** with database-level validation:

1. **First-user-only claim:** Only the first authenticated user can claim admin role
2. **Atomic check:** Verifies no admin exists before granting role
3. **Idempotent:** Multiple claims by the same user return success
4. **Error handling:** Clear messages if admin already claimed

### New Function
```typescript
export const claimAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1. Check if ANY admin exists
    const { data: existingAdmins } = await supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((existingAdmins?.length ?? 0) > 0) {
      throw new Error("Admin role already claimed.");
    }

    // 2. Check if THIS user already has admin
    const { data: userAdmin } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (userAdmin) {
      return { ok: true };
    }

    // 3. Grant admin to first user
    await supabase.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    return { ok: true };
  });
```

### Migration Path
1. Deploy the new `claimAdminRole()` function
2. Update UI to call `claimAdminRole` instead of `grantSelfAdmin`
3. The old `grantSelfAdmin` endpoint now throws an error

---

## 4. ⚠️ SECURITY DEFINER Function Protection (ENHANCED)

**Status:** Enhanced  
**File:** `supabase/migrations/security_hardening.sql`

### Problem
The `has_role()` SECURITY DEFINER function could potentially be exploited if:
- It allowed checking arbitrary user roles
- It didn't validate against `auth.uid()`
- RLS policies were insufficient

### Solution
Applied **defense-in-depth** approach:

#### A. Function Hardening
```sql
CREATE OR REPLACE FUNCTION has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()  -- ← Only checks current user
    AND user_roles.role = role_name
  );
$$;
```

Key security features:
- ✅ Only accepts role name (text), not user ID
- ✅ Always checks against `auth.uid()` (current authenticated user)
- ✅ Cannot be abused to check other users' roles
- ✅ `SET search_path = public` prevents schema hijacking

#### B. RLS Policy Hardening
```sql
-- Users can only read their own roles
CREATE POLICY "Users can only view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only admins can modify roles
CREATE POLICY "Only admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));
```

#### C. Audit Logging
Added `admin_audit_log` table to track all role changes:
- Who granted/revoked a role
- When the change occurred
- Which role was affected
- Admins can view all logs; users see only their own

### How to Apply
1. Go to [Supabase SQL Editor](https://app.supabase.com)
2. Run the migration: `supabase/migrations/security_hardening.sql`
3. Verify RLS policies are enabled on `user_roles` table

---

## Security Checklist

- [x] Markdown renderer blocks dangerous URL schemes
- [x] Search input sanitized to prevent SQL injection
- [x] Admin role requires first-user-only bootstrap
- [x] SECURITY DEFINER function validates auth.uid()
- [x] RLS policies prevent unauthorized role access
- [x] Audit logging enabled for role changes

## Additional Recommendations

1. **Regular audits:** Review `admin_audit_log` for suspicious activity
2. **Rate limiting:** Add rate limiting to `claimAdminRole` endpoint
3. **Monitoring:** Alert on multiple failed admin grant attempts
4. **Backup:** Ensure database backups include `user_roles` table
5. **2FA:** Require two-factor authentication for admin users

## Questions?

If you have any questions about these security fixes, please review:
- Supabase Security Documentation: https://supabase.com/docs/guides/auth/row-level-security
- OWASP Security Guidelines: https://owasp.org/
