#!/usr/bin/env node
/**
 * Produces a single phpMyAdmin-importable .sql file containing the full schema
 * plus all seed data:
 *
 *   deploy_ready/database/school_erp_full.sql
 *
 * Why this is not just a plain mysqldump:
 *
 * 1. Table-name casing. Windows MySQL/MariaDB runs with
 *    `lower_case_table_names=1`, so a local dump emits `user`, `reportcard`,
 *    etc. Hostinger runs Linux MySQL, which is case-SENSITIVE, and Prisma
 *    queries `User` / `ReportCard`. Importing a lowercase dump there produces
 *    "table doesn't exist" at runtime. The DDL is therefore taken from Prisma's
 *    own migration (already correctly cased) and the dumped INSERT statements
 *    are re-cased to match.
 *
 * 2. `_prisma_migrations`. The row marking the migration as applied is included,
 *    so a later `prisma migrate deploy` reports "no pending migrations" instead
 *    of trying to recreate tables that already exist.
 *
 * 3. Encoding. Written as UTF-8 with no BOM. A BOM makes phpMyAdmin fail on the
 *    very first statement.
 *
 * Usage:
 *   node scripts/build-sql-bundle.mjs
 *   MYSQL_BIN="C:/xampp/mysql/bin" SOURCE_DB=school_erp node scripts/build-sql-bundle.mjs
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'deploy_ready', 'database');
const outFile = path.join(outDir, 'school_erp_full.sql');

const MYSQL_BIN = process.env.MYSQL_BIN || 'C:/xampp/mysql/bin';
const SOURCE_DB = process.env.SOURCE_DB || 'school_erp';
const DB_USER = process.env.SOURCE_DB_USER || 'root';
const DB_PASS = process.env.SOURCE_DB_PASSWORD || '';

const log = (m) => process.stdout.write(`[sql] ${m}\n`);

// ------------------------------------------------------------ 1. locate DDL
const migrationsDir = path.join(root, 'backend', 'prisma', 'migrations');
const migrationDirs = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

if (migrationDirs.length === 0) throw new Error('no migrations found');
const migrationName = migrationDirs[migrationDirs.length - 1];
const ddl = fs.readFileSync(path.join(migrationsDir, migrationName, 'migration.sql'), 'utf8');
log(`schema from migration: ${migrationName}`);

// Table names in creation order — this order is FK-safe.
const tables = [...ddl.matchAll(/CREATE TABLE `([^`]+)`/g)].map((m) => m[1]);
log(`tables: ${tables.length}`);

// lowercase -> correct case
const caseMap = new Map(tables.map((t) => [t.toLowerCase(), t]));

// ------------------------------------------------------------ 2. dump data
log(`dumping data from ${SOURCE_DB} ...`);
const args = [
  `-u${DB_USER}`,
  ...(DB_PASS ? [`-p${DB_PASS}`] : []),
  '--no-create-info', // data only; DDL comes from the migration
  '--no-create-db',
  '--default-character-set=utf8mb4',
  '--complete-insert',
  '--single-transaction',
  '--skip-lock-tables',
  '--skip-add-locks',
  '--skip-comments',
  '--skip-set-charset',
  '--skip-disable-keys',
  SOURCE_DB,
];

const dump = execFileSync(path.join(MYSQL_BIN, 'mysqldump'), args, {
  encoding: 'utf8',
  maxBuffer: 512 * 1024 * 1024,
});

// ------------------------------------------------------------ 3. re-case
const insertRe = /^INSERT INTO `([^`]+)`/;
const byTable = new Map();
let prismaMigrationRows = [];
let rewritten = 0;
let skipped = new Set();

for (const line of dump.split(/\r?\n/)) {
  const m = line.match(insertRe);
  if (!m) continue;

  const dumped = m[1];

  if (dumped.toLowerCase() === '_prisma_migrations') {
    prismaMigrationRows.push(line);
    continue;
  }

  const correct = caseMap.get(dumped.toLowerCase());
  if (!correct) {
    skipped.add(dumped);
    continue;
  }

  const fixed = line.replace(insertRe, `INSERT INTO \`${correct}\``);
  if (!byTable.has(correct)) byTable.set(correct, []);
  byTable.get(correct).push(fixed);
  if (correct !== dumped) rewritten += 1;
}

log(`INSERT statements re-cased: ${rewritten}`);
if (skipped.size) log(`WARNING: skipped unknown tables: ${[...skipped].join(', ')}`);

// ------------------------------------------------------------ 4. assemble
const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
const parts = [];

parts.push(`-- School ERP — complete database (schema + seed data)
-- Generated ${now} from migration ${migrationName}
--
-- HOW TO IMPORT ON HOSTINGER
--   1. hPanel -> Databases -> phpMyAdmin -> select your database
--   2. Import tab -> Choose File -> this file -> Import
--
-- Safe to re-run: existing tables are dropped and recreated.
-- WARNING: re-running DELETES all current data in this database.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
`);

// Drop in reverse creation order so FK parents go last.
parts.push('\n-- ---------- drop existing objects ----------');
for (const t of [...tables].reverse()) {
  parts.push(`DROP TABLE IF EXISTS \`${t}\`;`);
}
parts.push('DROP TABLE IF EXISTS `_prisma_migrations`;');

parts.push(`
-- ---------- schema ----------
-- Verbatim from Prisma's migration, so column types, indexes and foreign keys
-- match exactly what the application expects.
`);
parts.push(ddl.trim());

parts.push(`
-- ---------- Prisma migration bookkeeping ----------
-- Lets \`prisma migrate deploy\` recognise this schema as already applied.

CREATE TABLE \`_prisma_migrations\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`checksum\` VARCHAR(64) NOT NULL,
  \`finished_at\` DATETIME(3) NULL,
  \`migration_name\` VARCHAR(255) NOT NULL,
  \`logs\` TEXT NULL,
  \`rolled_back_at\` DATETIME(3) NULL,
  \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`applied_steps_count\` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`);

if (prismaMigrationRows.length) {
  parts.push(prismaMigrationRows.join('\n'));
} else {
  log('WARNING: no _prisma_migrations row found in dump');
}

parts.push(`
-- ---------- seed data ----------`);
for (const t of tables) {
  const rows = byTable.get(t);
  if (!rows || rows.length === 0) continue;
  parts.push(`\n-- ${t}`);
  parts.push(rows.join('\n'));
}

parts.push(`
SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;
`);

// ------------------------------------------------------------ 5. write
fs.mkdirSync(outDir, { recursive: true });
// 'utf8' in Node never prepends a BOM, which phpMyAdmin would choke on.
fs.writeFileSync(outFile, parts.join('\n'), 'utf8');

const stat = fs.statSync(outFile);
const rowCount = [...byTable.values()].reduce((n, r) => n + r.length, 0);
log('----------------------------------------');
log(`tables with data : ${byTable.size}`);
log(`INSERT lines     : ${rowCount}`);
log(`output           : ${path.relative(root, outFile)} (${(stat.size / 1024).toFixed(0)} KB)`);
