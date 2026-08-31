#!/usr/bin/env node
/**
 * Builds `deploy_ready/` — a self-contained bundle to upload to Hostinger.
 *
 * Layout produced:
 *   deploy_ready/
 *     README_DEPLOY.md      step-by-step instructions
 *     backend/              Node API: compiled dist + prisma + assets
 *     public_html/          static frontend (+ .htaccess) for the web root
 *
 * Usage:
 *   npm run deploy:build
 *   VITE_API_URL=https://api.example.com/api npm run deploy:build
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'deploy_ready');
const backendOut = path.join(out, 'backend');
const webOut = path.join(out, 'public_html');

const API_URL = process.env.VITE_API_URL || '/api';

function log(msg) {
  process.stdout.write(`[deploy] ${msg}\n`);
}

function run(cmd, cwd, env = {}) {
  log(`${cmd}  (in ${path.relative(root, cwd) || '.'})`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
  } catch (err) {
    // On Windows the Prisma query engine DLL cannot be replaced while a running
    // process has it open, which surfaces as an opaque EPERM rename failure.
    if (cmd.includes('prisma generate')) {
      log('');
      log('prisma generate failed. If the error above mentions EPERM / rename of');
      log('query_engine-windows.dll.node, a running server is holding the file open.');
      log('Stop the dev stack first:');
      log('   npm run dev   <- stop this (Ctrl+C), then re-run the build');
      log('');
    }
    throw err;
  }
}

function copyDir(src, dest, skip = () => false) {
  if (!fs.existsSync(src)) throw new Error(`missing source directory: ${src}`);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d, skip);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

function countFiles(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(path.join(dir, e.name));
    else n += 1;
  }
  return n;
}

// ---------------------------------------------------------------- 1. clean
if (fs.existsSync(out)) {
  log('removing previous deploy_ready/');
  fs.rmSync(out, { recursive: true, force: true });
}
fs.mkdirSync(out, { recursive: true });

// ---------------------------------------------------------------- 2. build
run('npx prisma generate', path.join(root, 'backend'));
run('npm run build', path.join(root, 'backend'));
run('npm run build', path.join(root, 'frontend'), { VITE_API_URL: API_URL });

// ---------------------------------------------------------------- 3. backend
log('assembling backend/');
copyDir(path.join(root, 'backend', 'dist'), path.join(backendOut, 'dist'));
copyDir(path.join(root, 'backend', 'assets'), path.join(backendOut, 'assets'));
// Schema + migrations are required at runtime by `prisma migrate deploy`.
// seed.ts ships too so the database can be populated on first deploy.
copyDir(path.join(root, 'backend', 'prisma'), path.join(backendOut, 'prisma'), (name) =>
  name.endsWith('.db') || name.endsWith('.db-journal')
);

for (const f of ['package.json', 'package-lock.json', '.env.example']) {
  const src = path.join(root, 'backend', f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(backendOut, f));
}

// Uploads directory must exist for express.static and multer.
fs.mkdirSync(path.join(backendOut, 'uploads'), { recursive: true });
fs.writeFileSync(path.join(backendOut, 'uploads', '.gitkeep'), '');

// ---------------------------------------------------------------- 4. frontend
log('assembling public_html/');
copyDir(path.join(root, 'frontend', 'dist'), webOut);

fs.writeFileSync(
  path.join(webOut, '.htaccess'),
  `# React single-page app served by Apache / LiteSpeed (Hostinger).

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Never rewrite real files or directories (JS, CSS, images, uploads).
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Everything else is a client-side route -> let React Router handle it.
  RewriteRule ^ index.html [L]
</IfModule>

# index.html must never be cached, or browsers keep loading a stale bundle
# that references deleted hashed assets.
<FilesMatch "^index\\.html$">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </IfModule>
</FilesMatch>

# Build output is content-hashed, so it can be cached indefinitely.
<FilesMatch "\\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp)$">
  <IfModule mod_headers.c>
    Header set Cache-Control "public, max-age=31536000, immutable"
  </IfModule>
</FilesMatch>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript application/json image/svg+xml
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`
);

// ---------------------------------------------------------------- 5. env
fs.writeFileSync(
  path.join(out, '.env.production.example'),
  `# Rename to .env inside the backend folder on the server.
# Every value below must be filled in.

# --- MySQL (from hPanel -> Databases -> MySQL Databases) ---
# URL-encode special characters in the password: @ -> %40, # -> %23, / -> %2F
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME"

# --- Secrets: generate each with  openssl rand -hex 32 ---
JWT_SECRET=""
JWT_REFRESH_SECRET=""
REPORT_CARD_SECRET=""

JWT_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# --- Server ---
NODE_ENV=production
PORT=3000

# Public origin of the FRONTEND. Required: in production CORS allows only this.
FRONTEND_URL="https://your-domain.com"
APP_URL="https://your-domain.com"
API_URL="https://your-domain.com/api"

# --- Uploads ---
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# --- PDF rendering (server-side report card download) ---
# Point at the system Chromium. On a Hostinger VPS (Ubuntu):
#   sudo apt-get install -y chromium-browser
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# --- Email (optional) ---
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Mother Teresa Foundation School <noreply@your-domain.com>"
`
);

// ---------------------------------------------------------------- 6. guide
fs.copyFileSync(
  path.join(root, 'scripts', 'README_DEPLOY.md'),
  path.join(out, 'README_DEPLOY.md')
);

// ---------------------------------------------------------------- 7. summary
const built = {
  backendFiles: countFiles(backendOut),
  webFiles: countFiles(webOut),
  apiBase: API_URL,
  migrations: fs
    .readdirSync(path.join(backendOut, 'prisma', 'migrations'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name),
};

log('----------------------------------------');
log(`backend files : ${built.backendFiles}`);
log(`web files     : ${built.webFiles}`);
log(`frontend API  : ${built.apiBase}`);
log(`migrations    : ${built.migrations.join(', ') || 'NONE (!)'}`);
log('deploy_ready/ is ready to upload');
