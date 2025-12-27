-- Create owner role (highest level)
INSERT INTO "AdminRole" (id, name, description, permissions)
VALUES (gen_random_uuid()::text, 'owner', 'Owner - Full system access including team management', 'ALL')
ON CONFLICT (name) DO NOTHING;

-- Update elboraey to be owner
UPDATE "AdminUser" 
SET "roleId" = (SELECT id FROM "AdminRole" WHERE name = 'owner')
WHERE email LIKE '%elboraey%' OR name LIKE '%elboraey%' OR username LIKE '%elboraey%';
