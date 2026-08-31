# Deploying the School ERP to Hostinger

This folder is a complete, pre-built bundle. Nothing needs compiling on your
machine again.

```
deploy_ready/
├── database/
│   └── school_erp_full.sql   ← IMPORT THIS IN phpMyAdmin (schema + all data)
├── backend/                  Node.js API (already compiled to dist/)
│   ├── dist/                 compiled server — entry point: dist/server.js
│   ├── prisma/               schema + migrations + seed
│   ├── assets/               school banner embedded into generated PDFs
│   ├── uploads/              student photos / signatures (keep writable)
│   ├── package.json
│   └── package-lock.json
├── public_html/              static React frontend + .htaccess
└── .env.production.example   fill this in, rename to .env
```

---

## Step 1 — Import the database (phpMyAdmin)

This is the same for both hosting paths below.

1. hPanel → **Databases → MySQL Databases** → **Enter phpMyAdmin**
2. Select your database in the left sidebar (e.g. `u544715275_bmts`)
3. **Import** tab → **Choose File** → `database/school_erp_full.sql` → **Import**

That one file creates all 31 tables **and** loads the demo data (12 classes,
36 divisions, 92 subjects, 12 teachers, 120 students, 120 report cards) plus the
login accounts. Expect "Import has been successfully finished".

> Do **not** import `backend/prisma/migrations/*/migration.sql` instead. That
> file only creates empty tables — there would be no accounts and you could not
> log in.

The file also registers itself in Prisma's `_prisma_migrations` table, so a later
`npx prisma migrate deploy` correctly reports nothing pending rather than trying
to recreate the tables.

Re-importing is safe but **destructive**: it drops and recreates every table,
wiping current data.

### Building the connection string

`DATABASE_URL` must be URL-encoded. This trips people up constantly — if the
password contains `@`, `#`, `/`, `?` or `:` it **must** be escaped, or Prisma
misparses the host and fails with `P1001`.

| Character | Use |
|---|---|
| `@` | `%40` |
| `#` | `%23` |
| `/` | `%2F` |
| `?` | `%3F` |
| `:` | `%3A` |

So a password of `Savita@1313` becomes `Savita%401313`:

```
DATABASE_URL="mysql://u544715275_bmts:Savita%401313@srv1954.hstgr.io:3306/u544715275_bmts"
```

Use `srv1954.hstgr.io` as the MySQL host (from hPanel → Databases). If you
get `P1001` errors, try `localhost` instead.

---

Now pick **one** of the two paths below.

---

## Path A — Hostinger VPS (recommended)

Choose this if you want server-side **PDF download** to work. It needs a real
Chromium binary, which only a VPS gives you reliably.

### 1. Create the database

SSH into the VPS, then:

```bash
sudo apt update
sudo apt install -y mysql-server
sudo mysql -e "CREATE DATABASE school_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'erp'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';"
sudo mysql -e "GRANT ALL PRIVILEGES ON school_erp.* TO 'erp'@'localhost'; FLUSH PRIVILEGES;"
```

### 2. Install Node.js and Chromium

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs chromium-browser nginx
node -v    # expect v20.x
```

### 3. Upload and configure

Upload `backend/` to `/var/www/erp-backend` and the **contents** of
`public_html/` to `/var/www/erp-frontend`.

```bash
cd /var/www/erp-backend
cp /path/to/.env.production.example .env
nano .env          # fill in DATABASE_URL, the three secrets, FRONTEND_URL
npm install --omit=dev
```

Generate each secret with `openssl rand -hex 32`.

### 4. Load the database

If you already imported `database/school_erp_full.sql` (Step 1), skip this — the
schema and data are in place. To load it from the shell instead:

```bash
mysql -u erp -p school_erp < /path/to/database/school_erp_full.sql
```

Or build it from the migrations rather than the dump:

```bash
npx prisma migrate deploy      # creates all tables
npx prisma db seed             # demo accounts + sample data
```

### 5. Run the API under a process manager

```bash
sudo npm install -g pm2
pm2 start dist/server.js --name erp-api
pm2 save && pm2 startup        # run the printed command
```

### 6. Nginx: serve the frontend, proxy the API

`/etc/nginx/sites-available/erp`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/erp-frontend;
    index index.html;

    client_max_body_size 10m;

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;   # PDF rendering can be slow
    }

    location ^~ /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> The `^~` prefixes matter. Without them Nginx's static-file regex would
> intercept `/uploads/photo.png` and return 404 instead of proxying it.

```bash
sudo ln -s /etc/nginx/sites-available/erp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 7. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Then set `FRONTEND_URL=https://your-domain.com` in `.env` and `pm2 restart erp-api`.
In production CORS allows **only** `FRONTEND_URL`, so this must be exact.

### Alternative: Docker

The repository root ships a `docker-compose.yml` covering MySQL, the API and
Nginx. Copy the repo to the VPS, fill in the root `.env`, then:

```bash
docker compose up -d --build
docker exec school_erp_backend npx prisma db seed
```

---

## Path B — Hostinger Web / Business hosting (hPanel)

Simpler, but **server-side PDF download will not work** — Chromium is not
available on shared hosting. The browser **Print** button still works fully,
which is what the report cards are designed around.

### 1. MySQL database

Already handled by the phpMyAdmin import in **Step 1** above. Keep the database
name, user and password to hand — you need them for `DATABASE_URL` in step 3.

### 2. Upload the frontend

hPanel → **File Manager** → open `public_html`.
Upload everything **inside** `public_html/` from this bundle — including the
hidden `.htaccess`, which provides the SPA routing fallback. Without it, any
refresh on a route like `/admin/students` returns 404.

### 3. Deploy the backend as a Node.js application

hPanel → **Advanced → Node.js** (available on Business and Cloud plans):

| Setting | Value |
|---|---|
| Node.js version | 20 |
| Application root | `erp-backend` |
| Application startup file | `dist/server.js` |

Upload the `backend/` folder contents to that application root, then in the
Node.js panel add the environment variables from `.env.production.example`:

```
DATABASE_URL=mysql://u544715275_bmts:ENCODED_PASSWORD@srv1954.hstgr.io:3306/u544715275_bmts
JWT_SECRET=6ccf610c1cb7c03892752e0b33a9cfe648184f5479091c761ebeeee35af54566
JWT_REFRESH_SECRET=e79dbb05f284f18b82c1e64dc7d63517b1bd250beeffaaee721dc0e995a81610
REPORT_CARD_SECRET=f2d95b3b191ff479e36da2d0ea309b11
NODE_ENV=production
FRONTEND_URL=https://shubham.sanjivanitalenthub.com
UPLOAD_DIR=./uploads
```

URL-encode special characters in the DB password: `@` → `%40`, `#` → `%23`.

Then click **npm install** (or run `npm install --omit=dev`) and **restart** the
app.

No migration step is needed — Step 1's phpMyAdmin import already created the
tables and data. To confirm the app agrees, run in the panel's terminal:

```bash
npx prisma migrate status     # expect: "Database schema is up to date!"
```

### 4. Point the frontend at the API

The frontend was built to call the relative path `/api`. That works only if the
API answers on the same domain. If Hostinger gives the Node app a different
host (e.g. a subdomain), rebuild the frontend against it:

```bash
VITE_API_URL=https://api.sanjivanitalenthub.com/api npm run deploy:build
```

Then re-upload `public_html/` and set `FRONTEND_URL=https://shubham.sanjivanitalenthub.com`
on the backend so CORS accepts the browser's origin.

---

## First login

| Role | Login | Password |
|---|---|---|
| Admin | `admin@mtfschool.edu` or `admin` | `Admin@123` |
| Faculty | `teacher.10th@mtfschool.edu` or `teacher_10th` | `Faculty@123` |
| Student | `adm111@student.mtfschool.edu` or `adm111` | `Student@123` |

Students log in with their **admission number** as the username.

> Change the admin password immediately after the first login
> (**Profile Settings**). The seeded passwords are public knowledge.

---

## Verifying the deployment

```bash
curl https://your-domain.com/api/health
# {"success":true,"status":"ok",...}
```

Then in the browser: log in as admin → **Report Cards** → open a Std 10 student
→ **Print**. The preview should render with full styling.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| 404 on refreshing any route | `.htaccess` missing from `public_html` (Path B) or `try_files` missing (Path A) |
| Login works, pages stay blank | `FRONTEND_URL` does not exactly match the browser origin, so CORS blocks the API |
| `P1001: Can't reach database server` | Wrong `DATABASE_URL` host — use `localhost` on Hostinger, not `127.0.0.1` |
| `P1003: database does not exist` | Database not created in hPanel, or the name is missing its `u123456789_` prefix |
| Login rejects a correct password | `school_erp_full.sql` was never imported, so no accounts exist |
| `Table 'u..._bmts.User' doesn't exist` | A plain lowercase mysqldump was imported. Linux MySQL is case-sensitive — re-import `school_erp_full.sql`, which uses the correct `User` / `ReportCard` casing |
| `P1001: Can't reach database server` with a correct password | Unescaped `@` in the password inside `DATABASE_URL` — encode it as `%40` |
| Uploaded photos 404 | `/uploads/` is not being proxied to the backend |
| PDF download 500s | Chromium missing. Expected on shared hosting — use the Print button, or move to a VPS and set `PUPPETEER_EXECUTABLE_PATH` |
| Blank page, console 404s on `assets/*.js` | Stale `index.html` cached. Hard-refresh; `.htaccess` already sends no-cache for it |
