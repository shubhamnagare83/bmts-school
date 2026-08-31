import fs from 'fs';
import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';

/**
 * Directory holding backend-owned static assets that must be embedded into
 * generated PDFs (school banner, etc.).
 *
 * Resolved from the current working directory so it behaves the same whether the
 * server runs from `src` via tsx (development) or from `dist` (production).
 */
const ASSETS_DIR = path.resolve(process.cwd(), 'assets');

/** Directory where uploaded files (student photos, signatures) are stored. */
const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');

const MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/** Cache so the banner is only read from disk once per process. */
let cachedBanner: string | null = null;

function toDataUri(absolutePath: string): string {
  const mime = MIME_BY_EXTENSION[path.extname(absolutePath).toLowerCase()] || 'image/png';
  const base64 = fs.readFileSync(absolutePath).toString('base64');
  return `data:${mime};base64,${base64}`;
}

/**
 * Returns the school header banner as a data URI, or an empty string when the
 * asset is missing. Embedding it avoids the PDF renderer needing network access.
 */
export function getBannerDataUri(): string {
  if (cachedBanner !== null) return cachedBanner;

  cachedBanner = '';
  try {
    const bannerPath = path.join(ASSETS_DIR, 'school_header_banner.png');
    if (fs.existsSync(bannerPath)) {
      cachedBanner = toDataUri(bannerPath);
    } else {
      console.warn(`[pdf] School banner not found at ${bannerPath}; PDFs will render without it.`);
    }
  } catch (err) {
    console.error('[pdf] Failed to read school banner:', err);
  }

  return cachedBanner;
}

/**
 * Resolves a stored student photo reference into something embeddable.
 *
 * Handles the three shapes the value can take in the database:
 * - already a data URI or remote URL — returned unchanged
 * - a path under the uploads directory (with or without a leading `/uploads`)
 * - anything unresolvable — returns an empty string so the caller can fall back
 *
 * Paths are confined to the uploads directory to prevent traversal.
 */
export function getStudentPhotoDataUri(photo?: string | null): string {
  if (!photo) return '';

  const value = photo.trim();
  if (!value) return '';
  if (value.startsWith('data:') || /^https?:\/\//i.test(value)) return value;

  try {
    const relative = value.replace(/^[/\\]+/, '').replace(/^uploads[/\\]+/i, '');
    const absolute = path.resolve(UPLOADS_DIR, relative);

    // Reject anything that escapes the uploads directory.
    if (absolute !== UPLOADS_DIR && !absolute.startsWith(UPLOADS_DIR + path.sep)) {
      console.warn('[pdf] Rejected out-of-bounds photo path.');
      return '';
    }

    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) {
      return toDataUri(absolute);
    }
  } catch (err) {
    console.error('[pdf] Failed to read student photo:', err);
  }

  return '';
}

/**
 * Chromium flags required for reliable headless rendering inside containers.
 *
 * `--disable-dev-shm-usage` matters most: Docker defaults `/dev/shm` to 64 MB,
 * which makes Chromium crash part-way through rendering larger documents.
 */
const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--font-render-hinting=none',
  '--allow-file-access-from-files',
];

/**
 * Runs `fn` against a freshly launched browser page and guarantees the browser
 * is closed afterwards.
 *
 * The previous inline implementations closed the browser only on the success
 * path, so any rendering error leaked a Chromium process until the container
 * ran out of memory.
 */
export async function withPdfPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      // Honours PUPPETEER_EXECUTABLE_PATH when set (used by the Docker image),
      // otherwise falls back to Puppeteer's bundled Chromium.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: LAUNCH_ARGS,
    });

    const page = await browser.newPage();
    return await fn(page);
  } catch (err) {
    // Turn the most common misconfiguration into an actionable message.
    if (err instanceof Error && /Could not find (Chrome|Chromium)/i.test(err.message)) {
      throw new Error(
        'PDF generation requires Chromium, which is not installed. ' +
          'Run `npx puppeteer browsers install chrome` in the backend directory, ' +
          'or set PUPPETEER_EXECUTABLE_PATH to an existing Chromium binary. ' +
          `Original error: ${err.message}`
      );
    }
    throw err;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.error('[pdf] Failed to close browser cleanly:', err);
      }
    }
  }
}

/**
 * Renders an HTML string to a PDF.
 *
 * Always returns a `Buffer`. This matters: `page.pdf()` returns a `Uint8Array`
 * in Puppeteer v23+, and `res.send()` only treats `Buffer` as binary — handed a
 * plain `Uint8Array`, Express JSON-serialises it into `{"0":37,"1":80,...}`,
 * producing a corrupt download that is many times larger than the real file.
 */
export async function renderPdf(
  html: string,
  pdfOptions: Parameters<Page['pdf']>[0],
  configurePage?: (page: Page) => Promise<void>
): Promise<Buffer> {
  return withPdfPage(async (page) => {
    if (configurePage) await configurePage(page);

    // Puppeteer 25 removed `networkidle0` from setContent's waitUntil options,
    // so readiness is asserted explicitly below instead. That is more reliable
    // anyway: images are embedded as data URIs, which produce no network
    // activity for a network-idle heuristic to observe.
    await page.setContent(html, { waitUntil: 'load' });
    await waitForAssets(page);

    const bytes = await page.pdf(pdfOptions);
    return Buffer.from(bytes);
  });
}

/**
 * Blocks until webfonts are ready and every image has finished decoding, so a
 * page is never captured half-rendered.
 *
 * Failures are swallowed deliberately: a single broken image must not turn a
 * report card download into a 500.
 */
async function waitForAssets(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;

      await Promise.all(
        Array.from(document.images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        })
      );
    });
  } catch (err) {
    console.warn('[pdf] Asset readiness check failed; rendering anyway:', err);
  }
}
