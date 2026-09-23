// Node 20+. Stamps local <link rel="stylesheet"> and <script src> references
// in every root-level .html file with an 8-char sha256 hash of the referenced
// file's current contents, so browsers bust their cache on every real change.
// Idempotent: if the computed hash already matches what's in an HTML file,
// that file is left untouched.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

function hashFile(filePath) {
  const contents = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(contents).digest('hex').slice(0, 8);
}

function isLocalAsset(url) {
  if (/^https?:\/\//i.test(url)) return false;
  if (url.startsWith('//')) return false;
  return true;
}

function stampAttr(html, attrRegex) {
  let changed = false;
  const output = html.replace(attrRegex, (full, before, url, after) => {
    const [file] = url.split('?');
    if (!isLocalAsset(file)) return full;
    if (!/\.(css|js)$/i.test(file)) return full;

    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) return full;

    const hash = hashFile(filePath);
    const stamped = `${before}${file}?v=${hash}${after}`;
    if (stamped !== full) changed = true;
    return stamped;
  });
  return { output, changed };
}

const LINK_REGEX = /(<link[^>]*\shref=")([^"]+\.css(?:\?[^"]*)?)("[^>]*>)/g;
const SCRIPT_REGEX = /(<script[^>]*\ssrc=")([^"]+\.js(?:\?[^"]*)?)("[^>]*>)/g;

function main() {
  const htmlFiles = fs
    .readdirSync(ROOT)
    .filter((f) => f.toLowerCase().endsWith('.html'));

  let touched = 0;

  for (const file of htmlFiles) {
    const filePath = path.join(ROOT, file);
    const original = fs.readFileSync(filePath, 'utf8');

    const step1 = stampAttr(original, LINK_REGEX);
    const step2 = stampAttr(step1.output, SCRIPT_REGEX);
    const finalHtml = step2.output;

    if (finalHtml !== original) {
      fs.writeFileSync(filePath, finalHtml);
      console.log(`stamp-assets: updated ${file}`);
      touched += 1;
    }
  }

  if (touched === 0) {
    console.log('stamp-assets: nothing to update, all hashes already current.');
  }
}

main();
