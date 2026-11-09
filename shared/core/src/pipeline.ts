/**
 * Thin compatibility shim: the pipeline implementation now lives in
 * `./pipeline/` so every module stays under the 250-line limit while existing
 * imports (`./pipeline.js`) keep working unchanged.
 */

export * from './pipeline/index.js';
