const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT_DIR = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://portfolio.na0aaooq.com';

const HTML_FILES = [
  'index.html',
  'about.html',
  'products.html',
  'news.html',
  'contact.html',
  'privacy.html',
  'usage.html',
  'disclaimer.html',
  'sitemap.html',
  '404.html',
  'en/index.html',
  'en/about.html',
  'en/products.html',
  'en/news.html',
  'en/contact.html',
  'en/privacy.html',
  'en/usage.html',
  'en/disclaimer.html',
  'en/sitemap.html'
];

const REQUIRED_SITEMAP_URLS = [
  `${SITE_ORIGIN}/`,
  `${SITE_ORIGIN}/about.html`,
  `${SITE_ORIGIN}/products.html`,
  `${SITE_ORIGIN}/news.html`,
  `${SITE_ORIGIN}/contact.html`,
  `${SITE_ORIGIN}/privacy.html`,
  `${SITE_ORIGIN}/usage.html`,
  `${SITE_ORIGIN}/disclaimer.html`,
  `${SITE_ORIGIN}/sitemap.html`,
  `${SITE_ORIGIN}/en/index.html`
];

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

function removeQueryAndHash(reference) {
  return reference.split(/[?#]/)[0].trim();
}

function sitePathToFilePath(sitePath) {
  if (sitePath === '/' || sitePath === '') {
    return path.join(ROOT_DIR, 'index.html');
  }

  const relativePath = sitePath.startsWith('/') ? sitePath.slice(1) : sitePath;
  const resolvedPath = path.join(ROOT_DIR, relativePath);

  if (sitePath.endsWith('/')) {
    return path.join(resolvedPath, 'index.html');
  }

  return resolvedPath;
}

function resolveLocalReference(reference, sourceHtmlPath) {
  const trimmedReference = reference.trim();

  if (
    !trimmedReference ||
    trimmedReference.startsWith('#') ||
    /^(?:mailto|tel|javascript|data):/i.test(trimmedReference)
  ) {
    return null;
  }

  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(trimmedReference)) {
    const url = new URL(trimmedReference, SITE_ORIGIN);

    if (url.origin !== SITE_ORIGIN) {
      return null;
    }

    return sitePathToFilePath(url.pathname);
  }

  const cleanReference = removeQueryAndHash(trimmedReference);

  if (cleanReference === '/') {
    return path.join(ROOT_DIR, 'index.html');
  }

  if (cleanReference.startsWith('/')) {
    return sitePathToFilePath(cleanReference);
  }

  const sourceDirectory = path.dirname(path.join(ROOT_DIR, sourceHtmlPath));
  const resolvedPath = path.resolve(sourceDirectory, cleanReference);

  if (cleanReference.endsWith('/')) {
    return path.join(resolvedPath, 'index.html');
  }

  return resolvedPath;
}

function formatRelativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
}

test('HTML local links and asset references point to existing files', () => {
  for (const htmlFile of HTML_FILES) {
    const filePath = path.join(ROOT_DIR, htmlFile);
    const html = fs.readFileSync(filePath, 'utf8');
    const references = [...getAttributeValues(html, 'href'), ...getAttributeValues(html, 'src')];

    for (const reference of references) {
      const localPath = resolveLocalReference(reference, htmlFile);

      if (!localPath) {
        continue;
      }

      assert.ok(
        localPath.startsWith(ROOT_DIR),
        `${htmlFile} should not reference a file outside the repository: ${reference}`
      );
      assert.ok(
        fs.existsSync(localPath),
        `${htmlFile} should reference an existing local file: ${reference} -> ${formatRelativePath(localPath)}`
      );
    }
  }
});

test('robots.txt and sitemap.xml exist', () => {
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'robots.txt')), 'robots.txt should exist');
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'sitemap.xml')), 'sitemap.xml should exist');
});

test('sitemap.xml includes the main public pages', () => {
  const sitemap = fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8');

  for (const requiredUrl of REQUIRED_SITEMAP_URLS) {
    assert.ok(
      sitemap.includes(`<loc>${requiredUrl}</loc>`),
      `sitemap.xml should include ${requiredUrl}`
    );
  }
});
