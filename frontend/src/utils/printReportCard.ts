/**
 * Prints a report card preview with full visual fidelity.
 *
 * Implementation notes:
 * - Uses a hidden same-origin iframe instead of `window.open`, so popup blockers
 *   cannot silently break printing.
 * - Inlines the application's real stylesheets (read from `document.styleSheets`)
 *   instead of pulling Tailwind from a CDN at print time. This keeps `print:`
 *   variants working, and makes printing work offline and behind a strict CSP.
 * - Injects a `<base href>` so relative URLs (student photos, `/uploads/...`,
 *   fonts, logos) still resolve inside the generated document.
 * - Chooses the `@page` size from the template that is actually being printed:
 *   the secondary report card is a 16.5in x 8.5in landscape 3-panel brochure,
 *   every other template is A4 portrait.
 * - Waits for stylesheets, images and fonts to settle before printing, rather
 *   than guessing with a fixed timeout.
 */

const PRINT_AREA_IDS = [
  'printable-report-card',
  'report-card-print-area',
  'admin-report-card-print-area',
  'student-report-card-print-area',
  'faculty-report-card-print-area',
];

/** Page geometry for the two distinct report card layouts. */
const PAGE_GEOMETRY = {
  secondary: { size: '16.5in 8.5in', margin: '0' },
  a4: { size: 'A4 portrait', margin: '8mm' },
} as const;

function resolvePrintArea(printAreaId?: string): HTMLElement | null {
  if (printAreaId) {
    const explicit = document.getElementById(printAreaId);
    if (explicit) return explicit;
  }
  for (const id of PRINT_AREA_IDS) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

/**
 * Collects the CSS actually in use by the app.
 *
 * Same-origin stylesheets are inlined as text so the print document needs no
 * network access. Cross-origin sheets (e.g. hosted fonts) cannot be read via
 * `cssRules`, so they are re-linked with an absolute URL instead.
 */
function collectStyles(): string {
  const chunks: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet — fall back to linking it absolutely.
      if (sheet.href) {
        chunks.push(
          `<link rel="stylesheet" href="${new URL(sheet.href, document.baseURI).href}">`
        );
      }
      continue;
    }

    if (!rules) continue;
    const css = Array.from(rules)
      .map((rule) => rule.cssText)
      .join('\n');
    if (css.trim()) chunks.push(`<style>${css}</style>`);
  }

  // Inline <style> blocks are already covered by document.styleSheets above,
  // but keep any <link> that has not produced a CSSStyleSheet yet (still loading).
  const pendingLinks = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  ).filter((link) => !link.sheet && link.href);
  for (const link of pendingLinks) {
    chunks.push(`<link rel="stylesheet" href="${new URL(link.href, document.baseURI).href}">`);
  }

  return chunks.join('\n');
}

function buildPrintCss(isSecondary: boolean): string {
  const { size, margin } = isSecondary ? PAGE_GEOMETRY.secondary : PAGE_GEOMETRY.a4;

  return `
    @page {
      size: ${size};
      margin: ${margin};
    }

    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    /* The preview is wrapped in scroll/zoom containers in the app; neutralise
       them so nothing is clipped on paper. */
    .print-root,
    .print-root * {
      overflow: visible !important;
      max-height: none !important;
    }

    @media print {
      .secondary-report-card-page {
        width: 16.5in !important;
        height: 8.5in !important;
        margin: 0 auto !important;
        padding: 4.5mm 5mm !important;
        overflow: hidden !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      /* Each page forces a break, except the last one — otherwise the browser
         emits a trailing blank sheet. */
      .page-break-after {
        break-after: page !important;
        page-break-after: always !important;
      }
      .print-root > *:last-child .page-break-after:last-child,
      .page-break-after:last-child {
        break-after: auto !important;
        page-break-after: auto !important;
      }

      table, tr, td, th {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      img, svg {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    }
  `;
}

/** Resolves once every image in the document has loaded (or failed). */
function waitForImages(doc: Document, timeoutMs: number): Promise<void> {
  const images = Array.from(doc.images);
  const pending = images.filter((img) => !img.complete);

  if (pending.length === 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let remaining = pending.length;
    let settled = false;

    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) done();
    };

    for (const img of pending) {
      img.addEventListener('load', tick, { once: true });
      // A broken image must not block printing.
      img.addEventListener('error', tick, { once: true });
    }

    // Safety net so a hung request can never wedge the print flow.
    setTimeout(done, timeoutMs);
  });
}

export async function printReportCard(printAreaId?: string): Promise<void> {
  const printArea = resolvePrintArea(printAreaId);
  if (!printArea) {
    alert('Report card preview not found. Please open the preview first.');
    return;
  }

  const isSecondary = !!printArea.querySelector('.secondary-report-card-page');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', 'Report card print frame');
  // Kept in the layout (not display:none) because some browsers refuse to
  // paint/print a frame that has no box, but visually removed from the page.
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = iframe.contentDocument;
  if (!frameWindow || !frameDoc) {
    document.body.removeChild(iframe);
    alert('Unable to prepare the document for printing. Please try again.');
    return;
  }

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    // Defer so the browser has fully handed the job to the print subsystem.
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);
  };

  try {
    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <base href="${document.baseURI}">
  <title>Official Progress Report Card</title>
  ${collectStyles()}
  <style>${buildPrintCss(isSecondary)}</style>
</head>
<body>
  <div class="print-root">${printArea.innerHTML}</div>
</body>
</html>`);
    frameDoc.close();

    // Wait for assets so nothing prints half-rendered.
    await waitForImages(frameDoc, 8000);
    if (frameDoc.fonts?.ready) {
      await Promise.race([
        frameDoc.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }
    // Yield one frame so layout is flushed before the print dialog opens.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    // Fallback for browsers that do not fire `afterprint` from a frame.
    window.addEventListener('focus', cleanup, { once: true });

    frameWindow.focus();
    frameWindow.print();

    // Last-resort cleanup so the iframe never leaks if no event fires.
    setTimeout(cleanup, 60000);
  } catch (error) {
    console.error('Failed to print report card:', error);
    cleanup();
    alert('Something went wrong while preparing the printout. Please try again.');
  }
}
