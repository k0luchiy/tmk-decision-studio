/**
 * Thin compatibility shim: HelpDesk import now lives in `./helpdesk/` so every
 * module stays under the 250-line limit while `./helpdesk.js` imports keep
 * working.
 */

export * from './helpdesk/index.js';
