const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT_DIR = path.resolve(__dirname, '..');

const HTML_PAGES = [
  { path: 'index.html', lang: 'ja' },
  { path: 'about.html', lang: 'ja' },
  { path: 'products.html', lang: 'ja' },
  { path: 'news.html', lang: 'ja' },
  { path: 'contact.html', lang: 'ja' },
  { path: 'privacy.html', lang: 'ja' },
  { path: 'usage.html', lang: 'ja' },
  { path: 'disclaimer.html', lang: 'ja' },
  { path: 'sitemap.html', lang: 'ja' },
  { path: '404.html', lang: 'ja' },
  { path: 'en/index.html', lang: 'en' },
  { path: 'en/about.html', lang: 'en' },
  { path: 'en/products.html', lang: 'en' },
  { path: 'en/news.html', lang: 'en' },
  { path: 'en/contact.html', lang: 'en' },
  { path: 'en/privacy.html', lang: 'en' },
  { path: 'en/usage.html', lang: 'en' },
  { path: 'en/disclaimer.html', lang: 'en' },
  { path: 'en/sitemap.html', lang: 'en' }
];

const REQUIRED_OGP_PROPERTIES = ['og:title', 'og:description', 'og:type', 'og:url', 'og:image'];

function readHtml(relativePath) {
  const filePath = path.join(ROOT_DIR, relativePath);

  assert.ok(fs.existsSync(filePath), `${relativePath} should exist`);

  return fs.readFileSync(filePath, 'utf8');
}

function getAttribute(tag, attributeName) {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i');
  const match = pattern.exec(tag);

  return match ? match[2] || match[3] || '' : '';
}

function getAttributeValues(html, attributeName) {
  const values = [];
  const pattern = new RegExp(`${attributeName}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'gi');
  let match = pattern.exec(html);

  while (match) {
    values.push(match[2] || match[3] || '');
    match = pattern.exec(html);
  }

  return values;
}

function isExternalReference(reference) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(reference);
}

function removeQueryAndHash(reference) {
  return reference.split(/[?#]/)[0].trim();
}

function resolveLocalReference(reference, sourceHtmlPath) {
  const cleanReference = removeQueryAndHash(reference);

  if (
    !cleanReference ||
    cleanReference.startsWith('#') ||
    isExternalReference(cleanReference) ||
    /^(?:mailto|tel|javascript|data):/i.test(cleanReference)
  ) {
    return null;
  }

  if (cleanReference === '/') {
    return path.join(ROOT_DIR, 'index.html');
  }

  if (cleanReference.startsWith('/')) {
    return path.join(ROOT_DIR, cleanReference.slice(1));
  }

  const sourceDirectory = path.dirname(path.join(ROOT_DIR, sourceHtmlPath));
  const resolvedPath = path.resolve(sourceDirectory, cleanReference);

  if (cleanReference.endsWith('/')) {
    return path.join(resolvedPath, 'index.html');
  }

  return resolvedPath;
}

function assertMetaTagExists(html, name, htmlPath) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>`, 'i');

  assert.match(html, pattern, `${htmlPath} should include meta name="${name}"`);
}

function assertOgpPropertyExists(html, property, htmlPath) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\bproperty=["']${property}["'])[^>]*>`, 'i');

  assert.match(html, pattern, `${htmlPath} should include ${property}`);
}

function assertLocalCssAndJsReferencesExist(html, htmlPath) {
  const references = [...getAttributeValues(html, 'href'), ...getAttributeValues(html, 'src')];
  const localCssAndJsReferences = references
    .map((reference) => ({
      reference,
      localPath: resolveLocalReference(reference, htmlPath)
    }))
    .filter(({ localPath }) => localPath && /\.(?:css|js)$/i.test(localPath));

  assert.ok(localCssAndJsReferences.length > 0, `${htmlPath} should reference local CSS or JS`);

  for (const { reference, localPath } of localCssAndJsReferences) {
    assert.ok(
      fs.existsSync(localPath),
      `${htmlPath} should reference an existing local CSS/JS file: ${reference}`
    );
  }
}

for (const page of HTML_PAGES) {
  test(`${page.path} has required HTML metadata and local assets`, () => {
    const html = readHtml(page.path);
    const htmlTagPattern = new RegExp(`<html\\s+[^>]*lang=["']${page.lang}["']`, 'i');
    const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(html);
    const canonicalMatch = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i.exec(html);

    assert.match(html, htmlTagPattern, `${page.path} should use lang="${page.lang}"`);
    assert.ok(titleMatch, `${page.path} should include a title`);
    assert.notEqual(titleMatch[1].trim(), '', `${page.path} should include a non-empty title`);
    assertMetaTagExists(html, 'description', page.path);
    assert.ok(canonicalMatch, `${page.path} should include a canonical link`);
    assert.notEqual(
      getAttribute(canonicalMatch[0], 'href').trim(),
      '',
      `${page.path} canonical href should not be empty`
    );

    for (const property of REQUIRED_OGP_PROPERTIES) {
      assertOgpPropertyExists(html, property, page.path);
    }

    assertLocalCssAndJsReferencesExist(html, page.path);
  });
}
