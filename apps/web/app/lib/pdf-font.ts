import type { jsPDF } from 'jspdf';

import { DEJAVU_SANS_UA_BASE64 } from './dejavu-sans-ua-font';

const FONT_FILE = 'DejaVuSans-ua.ttf';
const FONT_NAME = 'DejaVuSansUA';

/**
 * Register an embedded Unicode (Cyrillic-capable) font with the jsPDF document
 * and return its family name. jsPDF's built-in fonts only cover Latin-1, so
 * Ukrainian text requires an embedded TTF.
 */
export function registerCyrillicFont(doc: jsPDF): string {
  doc.addFileToVFS(FONT_FILE, DEJAVU_SANS_UA_BASE64);
  doc.addFont(FONT_FILE, FONT_NAME, 'normal');
  return FONT_NAME;
}
