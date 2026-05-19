-- ============================================================
--  FIX: Remove RESPONSABLE role from ADMIN users
--  Each user should have exactly ONE role
-- ============================================================

-- Remove RESPONSABLE role from any user who already has ADMIN role
DELETE ur FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'RESPONSABLE'
  AND ur.user_id IN (
    SELECT user_id FROM user_roles ur2
    INNER JOIN roles r2 ON ur2.role_id = r2.id
    WHERE r2.name = 'ADMIN'
  );

-- Remove CHARGEDOSSIER role from any user who already has ADMIN role
DELETE ur FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'CHARGEDOSSIER'
  AND ur.user_id IN (
    SELECT user_id FROM user_roles ur2
    INNER JOIN roles r2 ON ur2.role_id = r2.id
    WHERE r2.name = 'ADMIN'
  );

-- Remove CHARGEDOSSIER role from any user who already has RESPONSABLE role
DELETE ur FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'CHARGEDOSSIER'
  AND ur.user_id IN (
    SELECT user_id FROM user_roles ur2
    INNER JOIN roles r2 ON ur2.role_id = r2.id
    WHERE r2.name = 'RESPONSABLE'
  );

-- Remove RESPONSABLE role from any user who already has CHARGEDOSSIER role
DELETE ur FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'RESPONSABLE'
  AND ur.user_id IN (
    SELECT user_id FROM user_roles ur2
    INNER JOIN roles r2 ON ur2.role_id = r2.id
    WHERE r2.name = 'CHARGEDOSSIER'
  );

-- Verify result: each user should now have exactly 1 role
SELECT u.username, GROUP_CONCAT(r.name) as roles, COUNT(r.id) as role_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username
ORDER BY u.username;
