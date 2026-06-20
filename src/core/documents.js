// src/core/documents.js
// Verwaltung der repo-lokalen PDF-Bibliothek unter docs/pdfs/.
//
// Manifest-Schema (docs/pdfs/manifest.json):
//   [
//     {
//       "name":      "wolf-cha-monoblock",         // technischer Schlüssel, vom Modell genutzt
//       "file":      "wolf-cha-monoblock.pdf",     // Dateiname relativ zu docs/pdfs/
//       "title":     "WOLF CHA Monoblock – Planungsunterlagen",
//       "summary":   "Auslegungsdaten, Schallwerte, hydraulische Einbindung",
//       "sizeBytes": 2843211
//     }
//   ]
//
// PDFs > MAX_PDF_BYTES werden abgelehnt – Anthropic verkraftet zwar bis 32 MB,
// aber >10 MB sprengt das Token-Budget bei Haiku schnell.
import fs from 'fs';
import path from 'path';
import { paths } from '../config.js';

const MANIFEST_PATH = path.join(paths.repoRoot, 'docs/pdfs/manifest.json');
const PDF_DIR = path.join(paths.repoRoot, 'docs/pdfs');
const MAX_PDF_BYTES = 10 * 1024 * 1024;

let _manifest = null;

function loadManifest() {
  if (_manifest) return _manifest;
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.warn(
      '[documents] Kein manifest.json unter docs/pdfs gefunden – Document-Tools liefern leere Liste.'
    );
    _manifest = [];
    return _manifest;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    if (!Array.isArray(parsed)) {
      console.warn('[documents] manifest.json ist kein Array – wird ignoriert.');
      _manifest = [];
    } else {
      _manifest = parsed;
    }
  } catch (e) {
    console.error(
      '[documents] manifest.json konnte nicht gelesen werden:',
      e?.message
    );
    _manifest = [];
  }
  return _manifest;
}

export function list() {
  return loadManifest().map(({ name, title, summary, sizeBytes }) => ({
    name,
    title,
    summary,
    sizeBytes,
  }));
}

/**
 * Liest ein PDF aus docs/pdfs/ und liefert es base64-codiert,
 * geeignet als Anthropic document content block.
 *
 * @param {string} name  Name aus dem Manifest
 * @returns {Promise<{title:string, base64:string, media_type:string}>}
 */
export async function read(name) {
  const entry = loadManifest().find(e => e.name === name);
  if (!entry) {
    throw new Error(`unbekanntes Dokument: ${name}`);
  }
  if (!entry.file) {
    throw new Error(`Manifest-Eintrag "${name}" hat kein "file"-Feld.`);
  }
  const filePath = path.join(PDF_DIR, entry.file);
  const stat = await fs.promises.stat(filePath);
  if (stat.size > MAX_PDF_BYTES) {
    throw new Error(
      `PDF "${name}" ist ${(stat.size / 1024 / 1024).toFixed(
        1
      )} MB groß – über dem Limit von 10 MB.`
    );
  }
  const buf = await fs.promises.readFile(filePath);
  return {
    title: entry.title || name,
    base64: buf.toString('base64'),
    media_type: 'application/pdf',
  };
}
