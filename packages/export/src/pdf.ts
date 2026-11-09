/**
 * Thin compatibility shim: PDF export now lives in `./pdf/` so every module
 * stays under the 250-line limit while `./pdf.js` imports keep working.
 */

export * from './pdf/index.js';
