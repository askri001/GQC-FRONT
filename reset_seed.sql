-- ============================================================
--  GAC SEED DATA
--  Run this AFTER:
--  1. reset_database.sql has been run
--  2. Spring Boot backend has fully started (all tables created by Hibernate)
-- ============================================================

USE gac_db;

-- ============================================================
--  ROLES
-- ============================================================
INSERT INTO roles (name, description) VALUES
  ('ADMIN',         'Administrateur — gestion utilisateurs et rôles'),
  ('RESPONSABLE',   'Responsable — validation/rejet dossiers, affaires, missions, factures'),
  ('CHARGEDOSSIER', 'Chargé de dossier — création et gestion des dossiers contentieux');

-- ============================================================
--  USERS  (passwords are the real BCrypt hashes from your DB)
--
--  admin          → your existing password
--  responsable1   → your existing password
--  chargedossier1 → your existing password
--  hoha           → your existing password
--  askrii         → your existing password (set as RESPONSABLE)
--  jjjj           → your existing password (set as CHARGEDOSSIER)
-- ============================================================
INSERT INTO users (dtype, username, password, nom, prenom, email, telephone, enabled) VALUES
  ('User', 'admin',          '$2a$10$ifVLzjQ.PocbIcW9WRGjb.GHb4GDNdsMofyjD6cz7p0kTZafvPZXm', 'Askri',       'Amine',  'aaskri001@gmail.com',   NULL, 1),
  ('User', 'responsable1',   '$2a$10$lILY4ceKYVM7LRYQKdDzsetZ6UsQtzFo/mSJV8/oSUju90nisDyVK', 'Ben Salem',   'Karim',  'responsable@bna.tn',    NULL, 1),
  ('User', 'chargedossier1', '$2a$10$bQ1sUBCxEQaWiIvqu5MuEeNmWemvUx1bCVNzu.RnOwvYr7vT320ny', 'Trabelsi',    'Sonia',  'chargedossier1@bna.tn', NULL, 1),
  ('User', 'hoha',           '$2a$10$Ucg.ilO2/djOBoZGMdH/yurSUGGNphQKgyjhIP3P8P8P6lz7APlzu', 'Dupon',       'Jean',   'hoha@bna.tn',           NULL, 1),
  ('User', 'askrii',         '$2a$10$L4NDDmg1D/CawVldzGjy9ORD7Oi6vblzg1/KiKf86C78SdMgqmZIq', 'Askri',       'Amine',  'ddddd@gmail.com',       NULL, 1),
  ('User', 'jjjj',           '$2a$10$cTIqkt7xcVtTBJf7Xop0VOmsNgrAEIn4v9fcUKmPLaziZ9QAhIoYm', 'Amine Askri', 'hhhhh',  'jjjj@bna.tn',           NULL, 1);

-- ============================================================
--  USER → ROLE  (one role per user, correct assignments)
-- ============================================================
INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id_role FROM users u, roles r WHERE u.username = 'admin'          AND r.name = 'ADMIN';

INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id_role FROM users u, roles r WHERE u.username = 'hoha'           AND r.name = 'ADMIN';

INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id_role FROM users u, roles r WHERE u.username = 'responsable1'   AND r.name = 'RESPONSABLE';

INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id_role FROM users u, roles r WHERE u.username = 'askrii'         AND r.name = 'RESPONSABLE';

INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id_role FROM users u, roles r WHERE u.username = 'chargedossier1' AND r.name = 'CHARGEDOSSIER';

INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id_role FROM users u, roles r WHERE u.username = 'jjjj'           AND r.name = 'CHARGEDOSSIER';

-- ============================================================
--  VERIFY — each user should have exactly 1 role
-- ============================================================
SELECT u.username, u.nom, u.prenom, u.enabled,
       GROUP_CONCAT(r.name) AS role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id_role
GROUP BY u.id, u.username, u.nom, u.prenom, u.enabled
ORDER BY r.name, u.username;
