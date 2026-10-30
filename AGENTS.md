# Architecture rules

- Authenticate with Cloud Auth and load roles from `public.user_roles`; never fabricate users or privileged roles, because database policies require a real verified session.
- Protect operational pages with the shared auth provider; keep database RLS as the authoritative permission boundary.