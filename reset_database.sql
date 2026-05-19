-- ============================================================
--  GAC DATABASE RESET
--  Run this in MySQL Workbench against your MySQL server
--  After running: restart the Spring Boot backend in IntelliJ
--  The backend will recreate all tables automatically (ddl-auto=update)
--  Then run the seed script below
-- ============================================================

-- Step 1: Drop and recreate the database
DROP DATABASE IF EXISTS gac_db;
CREATE DATABASE gac_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gac_db;

-- ============================================================
--  DONE. Now restart the Spring Boot backend in IntelliJ.
--  Wait for it to fully start (all tables created by Hibernate).
--  Then run reset_seed.sql in MySQL Workbench.
-- ============================================================
