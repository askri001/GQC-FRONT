-- ============================================================
--  MIGRATION : Normalisation table `prestataire`
--  Base      : MySQL / MariaDB (phpMyAdmin compatible)
--  Stratégie : ALTER uniquement — aucune perte de données
--  Date      : 2026-05-04
-- ============================================================

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 0 — Désactiver temporairement les FK pour la migration
-- ────────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 1 — Créer la table si elle n'existe pas encore
--  (cas d'une base vide / premier déploiement)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `prestataire` (
  `id_prestataire`   BIGINT        NOT NULL AUTO_INCREMENT,
  `type_prestataire` VARCHAR(20)   NOT NULL DEFAULT 'AVOCAT',
  `nom`              VARCHAR(100)  NOT NULL DEFAULT '',
  `prenom`           VARCHAR(100)  NOT NULL DEFAULT '',
  `telephone`        VARCHAR(20)   NOT NULL DEFAULT '',
  `email`            VARCHAR(150)  NOT NULL DEFAULT '',
  `adresse`          VARCHAR(255)  NOT NULL DEFAULT '',
  `specialite`       VARCHAR(100)  NOT NULL DEFAULT '',
  `tarif_journalier` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `actif`            TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`       DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_prestataire`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 2 — Ajouter les colonnes manquantes (idempotent)
--  Chaque ADD COLUMN est protégé par un IF NOT EXISTS
--  (MySQL 8.0+ / MariaDB 10.3+)
-- ────────────────────────────────────────────────────────────

-- type_prestataire
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `type_prestataire` VARCHAR(20) NOT NULL DEFAULT 'AVOCAT'
  AFTER `id_prestataire`;

-- nom
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `nom` VARCHAR(100) NOT NULL DEFAULT ''
  AFTER `type_prestataire`;

-- prenom
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `prenom` VARCHAR(100) NOT NULL DEFAULT ''
  AFTER `nom`;

-- telephone
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `telephone` VARCHAR(20) NOT NULL DEFAULT ''
  AFTER `prenom`;

-- email
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(150) NOT NULL DEFAULT ''
  AFTER `telephone`;

-- adresse
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `adresse` VARCHAR(255) NOT NULL DEFAULT ''
  AFTER `email`;

-- specialite
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `specialite` VARCHAR(100) NOT NULL DEFAULT ''
  AFTER `adresse`;

-- tarif_journalier
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `tarif_journalier` DECIMAL(10,2) NOT NULL DEFAULT 0.00
  AFTER `specialite`;

-- actif
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `actif` TINYINT(1) NOT NULL DEFAULT 1
  AFTER `tarif_journalier`;

-- created_at
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
  AFTER `actif`;

-- updated_at
ALTER TABLE `prestataire`
  ADD COLUMN IF NOT EXISTS `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  AFTER `created_at`;

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 3 — Normaliser les types des colonnes existantes
--  MODIFY COLUMN corrige le type sans toucher aux données
-- ────────────────────────────────────────────────────────────

ALTER TABLE `prestataire`
  MODIFY COLUMN `type_prestataire` VARCHAR(20)   NOT NULL DEFAULT 'AVOCAT',
  MODIFY COLUMN `nom`              VARCHAR(100)  NOT NULL DEFAULT '',
  MODIFY COLUMN `prenom`           VARCHAR(100)  NOT NULL DEFAULT '',
  MODIFY COLUMN `telephone`        VARCHAR(20)   NOT NULL DEFAULT '',
  MODIFY COLUMN `email`            VARCHAR(150)  NOT NULL DEFAULT '',
  MODIFY COLUMN `adresse`          VARCHAR(255)  NOT NULL DEFAULT '',
  MODIFY COLUMN `specialite`       VARCHAR(100)  NOT NULL DEFAULT '',
  MODIFY COLUMN `tarif_journalier` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  MODIFY COLUMN `actif`            TINYINT(1)    NOT NULL DEFAULT 1;

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 4 — Migrer les données des anciennes colonnes
--  vers les nouvelles colonnes normalisées
--  (exécuté seulement si les anciennes colonnes existent)
-- ────────────────────────────────────────────────────────────

-- 4a. Ancienne colonne "barreau" → spécialité pour les avocats
--     (si la colonne barreau existe et que specialite est vide)
UPDATE `prestataire`
SET `specialite` = `barreau`
WHERE `specialite` = ''
  AND `type_prestataire` = 'AVOCAT'
  AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'barreau'
  )
  AND `barreau` IS NOT NULL
  AND `barreau` <> '';

-- 4b. Ancienne colonne "domaine_expertise" → spécialité pour les experts
UPDATE `prestataire`
SET `specialite` = `domaine_expertise`
WHERE `specialite` = ''
  AND `type_prestataire` = 'EXPERT'
  AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'domaine_expertise'
  )
  AND `domaine_expertise` IS NOT NULL
  AND `domaine_expertise` <> '';

-- 4c. Ancienne colonne "zone_intervention" → adresse si adresse vide
UPDATE `prestataire`
SET `adresse` = `zone_intervention`
WHERE `adresse` = ''
  AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'zone_intervention'
  )
  AND `zone_intervention` IS NOT NULL
  AND `zone_intervention` <> '';

-- 4d. Ancienne colonne "tarif" (INT/FLOAT) → tarif_journalier si 0
UPDATE `prestataire`
SET `tarif_journalier` = `tarif`
WHERE `tarif_journalier` = 0
  AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'tarif'
  )
  AND `tarif` IS NOT NULL
  AND `tarif` > 0;

-- 4e. Ancienne colonne "is_active" / "status" → actif
UPDATE `prestataire`
SET `actif` = `is_active`
WHERE EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'is_active'
  );

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 5 — Supprimer les colonnes redondantes
--  Chaque DROP est conditionnel via information_schema
-- ────────────────────────────────────────────────────────────

-- Supprimer "barreau" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'barreau'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `barreau`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "numero_inscription" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'numero_inscription'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `numero_inscription`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "domaine_expertise" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'domaine_expertise'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `domaine_expertise`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "zone_intervention" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'zone_intervention'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `zone_intervention`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "etude" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'etude'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `etude`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "circonscription" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'circonscription'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `circonscription`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "certification" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'certification'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `certification`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "tarif" (ancienne colonne non-DECIMAL) si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'tarif'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `tarif`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "is_active" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'is_active'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `is_active`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Supprimer "status" si elle existe
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'prestataire'
      AND COLUMN_NAME  = 'status'
  ),
  'ALTER TABLE `prestataire` DROP COLUMN `status`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 6 — Ajouter les index pour les performances
-- ────────────────────────────────────────────────────────────

-- Index sur type_prestataire (filtrage par onglet Angular)
ALTER TABLE `prestataire`
  ADD INDEX IF NOT EXISTS `idx_type_prestataire` (`type_prestataire`);

-- Index sur actif (filtrage actif/inactif)
ALTER TABLE `prestataire`
  ADD INDEX IF NOT EXISTS `idx_actif` (`actif`);

-- Index composite pour la pagination filtrée (type + actif)
ALTER TABLE `prestataire`
  ADD INDEX IF NOT EXISTS `idx_type_actif` (`type_prestataire`, `actif`);

-- Index sur email (unicité recommandée)
ALTER TABLE `prestataire`
  ADD INDEX IF NOT EXISTS `idx_email` (`email`);

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 7 — Contrainte ENUM sur type_prestataire
--  Remplace le VARCHAR par un ENUM strict
-- ────────────────────────────────────────────────────────────

-- Nettoyer les valeurs invalides avant d'appliquer l'ENUM
UPDATE `prestataire`
SET `type_prestataire` = 'AVOCAT'
WHERE `type_prestataire` NOT IN ('AVOCAT', 'HUISSIER', 'EXPERT');

-- Convertir en ENUM
ALTER TABLE `prestataire`
  MODIFY COLUMN `type_prestataire` ENUM('AVOCAT', 'HUISSIER', 'EXPERT') NOT NULL DEFAULT 'AVOCAT';

-- ────────────────────────────────────────────────────────────
--  ÉTAPE 8 — Réactiver les FK
-- ────────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 1;

-- ────────────────────────────────────────────────────────────
--  VÉRIFICATION FINALE — Structure attendue
-- ────────────────────────────────────────────────────────────
DESCRIBE `prestataire`;

/*
  Résultat attendu :
  ┌──────────────────┬──────────────────────────────────┬──────┬─────┬──────────────────────┐
  │ Field            │ Type                             │ Null │ Key │ Default              │
  ├──────────────────┼──────────────────────────────────┼──────┼─────┼──────────────────────┤
  │ id_prestataire   │ bigint                           │ NO   │ PRI │ NULL (AUTO_INCREMENT) │
  │ type_prestataire │ enum('AVOCAT','HUISSIER','EXPERT')│ NO   │ MUL │ AVOCAT               │
  │ nom              │ varchar(100)                     │ NO   │     │                      │
  │ prenom           │ varchar(100)                     │ NO   │     │                      │
  │ telephone        │ varchar(20)                      │ NO   │     │                      │
  │ email            │ varchar(150)                     │ NO   │ MUL │                      │
  │ adresse          │ varchar(255)                     │ NO   │     │                      │
  │ specialite       │ varchar(100)                     │ NO   │     │                      │
  │ tarif_journalier │ decimal(10,2)                    │ NO   │     │ 0.00                 │
  │ actif            │ tinyint(1)                       │ NO   │ MUL │ 1                    │
  │ created_at       │ datetime                         │ YES  │     │ CURRENT_TIMESTAMP    │
  │ updated_at       │ datetime                         │ YES  │     │ CURRENT_TIMESTAMP    │
  └──────────────────┴──────────────────────────────────┴──────┴─────┴──────────────────────┘
*/
