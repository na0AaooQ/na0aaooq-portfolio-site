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

test('About pages provide aligned Nanahoshi supporter artwork', () => {
  const japaneseAboutPage = readHtml('about.html');
  const englishAboutPage = readHtml('en/about.html');
  const imageFileName = 'kokoro-mimamori-kun-chan-close-friends.png';
  const originalIllustrationFileName = 'kokoro-mimamori-illustration.jpg';
  const originalPostUrl = 'https://x.com/nana_uranai/status/2075578479094153224';
  const profileUrl = 'https://x.com/nana_uranai';
  const noteSection = '<section class="note-articles-section">';

  assert.ok(japaneseAboutPage.includes('<h3>応援イラスト</h3>'));
  assert.ok(
    japaneseAboutPage.includes(
      '「こころみまもり」の活動を応援してくださっている方々からいただいたイラストをご紹介します。'
    )
  );
  assert.ok(englishAboutPage.includes('<h3>Supporter Artwork</h3>'));
  assert.ok(
    englishAboutPage.includes(
      'Here are illustrations kindly created by people who support the Kokoro Mimamori initiative.'
    )
  );

  assert.ok(japaneseAboutPage.includes(`src="assets/img/kokoro-mimamori/${imageFileName}"`));
  assert.ok(englishAboutPage.includes(`src="../assets/img/kokoro-mimamori/${imageFileName}"`));
  assert.ok(
    japaneseAboutPage.includes(
      'alt="「こころみまもりくん」と「こころみまもりちゃん」が仲良く手をつないでいる手描きイラスト"'
    )
  );
  assert.ok(
    englishAboutPage.includes(
      'alt="Hand-drawn illustration of Kokoro Mimamori-kun and Kokoro Mimamori-chan holding hands as close friends"'
    )
  );

  for (const html of [japaneseAboutPage, englishAboutPage]) {
    assert.ok(html.includes(`href="${originalPostUrl}"`));
    assert.ok(html.includes(`href="${profileUrl}"`));
    assert.ok(
      html.indexOf(originalIllustrationFileName) < html.indexOf(imageFileName),
      'the new illustration should follow the existing illustration'
    );
    assert.ok(
      html.indexOf(imageFileName) < html.indexOf(noteSection),
      'the new illustration should precede the related note articles'
    );

    for (const illustrationFileName of [originalIllustrationFileName, imageFileName]) {
      const imageIndex = html.indexOf(illustrationFileName);
      const buttonStartIndex = html.lastIndexOf('<button', imageIndex);
      const buttonEndIndex = html.indexOf('</button>', imageIndex);

      assert.ok(imageIndex >= 0, `${illustrationFileName} should be present`);
      assert.ok(buttonStartIndex >= 0, `${illustrationFileName} should be in a button`);
      assert.ok(
        buttonEndIndex > imageIndex,
        `${illustrationFileName} button should close after image`
      );
      assert.ok(
        html.slice(buttonStartIndex, buttonEndIndex).includes('data-image-modal-trigger'),
        `${illustrationFileName} should open the existing image modal`
      );
    }

    const ids = getAttributeValues(html, 'id').filter(Boolean);
    assert.equal(
      new Set(ids).size,
      ids.length,
      'About page should not include duplicate id attributes'
    );
  }
});

test('English top page provides products and news previews in the Japanese top page sequence', () => {
  const englishTopPage = readHtml('en/index.html');
  const productsIndex = englishTopPage.indexOf('<h2>Products</h2>');
  const aboutIndex = englishTopPage.indexOf('<h2>About the Developer</h2>');
  const newsIndex = englishTopPage.indexOf('<h2>News</h2>');

  assert.ok(productsIndex >= 0, 'en/index.html should include a Products section');
  assert.ok(aboutIndex >= 0, 'en/index.html should include an About the Developer section');
  assert.ok(newsIndex >= 0, 'en/index.html should include a News section');
  assert.ok(productsIndex < aboutIndex, 'Products should appear before About the Developer');
  assert.ok(aboutIndex < newsIndex, 'About the Developer should appear before News');
  assert.ok(
    englishTopPage.includes('id="top-products-list"'),
    'en/index.html should include the top products list'
  );
  assert.ok(
    englishTopPage.includes('id="top-news-list"'),
    'en/index.html should include the top news list'
  );
  assert.ok(
    englishTopPage.includes(
      'href="products.html" class="button button-secondary">View all products'
    ),
    'en/index.html should link to all products'
  );
  assert.ok(
    englishTopPage.includes('href="news.html" class="button button-secondary">View all news'),
    'en/index.html should link to all news'
  );
  assert.doesNotMatch(
    englishTopPage,
    /<h2>Selected Work<\/h2>/,
    'en/index.html should not retain the Selected Work section'
  );
  assert.ok(
    englishTopPage.includes('../assets/data/en/products-data.js'),
    'en/index.html should load English product data'
  );
  assert.ok(
    englishTopPage.includes('../assets/data/en/news-data.js'),
    'en/index.html should load English news data'
  );
});

test('Products pages provide the Kokoro Mimamori explanation and inquiry path before the product list', () => {
  const japaneseProductsPage = readHtml('products.html');
  const englishProductsPage = readHtml('en/products.html');

  assert.ok(
    japaneseProductsPage.includes(
      '人の心をそっと守る仕組みづくりの一環として、「こころみまもり」シリーズを中心に、アプリやプロダクトを開発しています。'
    )
  );
  assert.ok(
    japaneseProductsPage.includes(
      '「こころみまもり」とは、人の心をそっと守るための、やさしいコミュニケーションを支えるアプリ・プロダクトの総称です。'
    )
  );
  assert.ok(
    japaneseProductsPage.includes(
      '<a href="about.html" target="_blank" rel="noopener noreferrer">開発者について</a>'
    )
  );
  assert.ok(
    japaneseProductsPage.includes(
      '<a href="contact.html" class="button button-primary products-intro__cta">お仕事・取材のご相談はこちら</a>'
    )
  );
  assert.ok(
    japaneseProductsPage.indexOf('products-intro-section') <
      japaneseProductsPage.indexOf('products-list-section')
  );

  assert.ok(
    englishProductsPage.includes(
      'I develop apps and products centered on the “Kokoro Mimamori” series, with the aim of supporting people’s emotional well-being through gentler communication.'
    )
  );
  assert.ok(
    englishProductsPage.includes(
      '“Kokoro Mimamori” is the collective name for a series of apps and products designed to support gentler communication and help reduce emotional harm.'
    )
  );
  assert.ok(
    englishProductsPage.includes(
      '<a href="about.html" target="_blank" rel="noopener noreferrer">About</a>'
    )
  );
  assert.ok(
    englishProductsPage.includes(
      '<a href="contact.html" class="button button-primary products-intro__cta">Work &amp; Media Inquiries</a>'
    )
  );
  assert.ok(
    englishProductsPage.indexOf('products-intro-section') <
      englishProductsPage.indexOf('<section class="section">')
  );
});

test('About pages link only the Kokoro Mimamori series name to Products', () => {
  const japaneseAboutPage = readHtml('about.html');
  const englishAboutPage = readHtml('en/about.html');

  assert.ok(
    japaneseAboutPage.includes(
      '<a href="products.html" target="_blank" rel="noopener noreferrer">「こころみまもり」シリーズ</a>'
    )
  );
  assert.ok(
    englishAboutPage.includes(
      '<a href="products.html" target="_blank" rel="noopener noreferrer">“Kokoro Mimamori” series</a>'
    )
  );
});

test('Contact pages expose the work inquiry category and the backend allows its value', () => {
  const japaneseContactPage = readHtml('contact.html');
  const englishContactPage = readHtml('en/contact.html');
  const lambdaSource = fs.readFileSync(
    path.join(ROOT_DIR, 'aws/lambda/portfolio-site-contact-form-lambda/lambda_function.py'),
    'utf8'
  );

  assert.ok(
    japaneseContactPage.includes(
      '<option value="media">掲載・取材について</option>\n              <option value="work">お仕事のご依頼について</option>\n              <option value="other">その他</option>'
    )
  );
  assert.ok(
    englishContactPage.includes(
      '<option value="media">Media / interview</option>\n              <option value="work">Work / Project Inquiries</option>\n              <option value="other">Other</option>'
    )
  );
  assert.match(
    lambdaSource,
    /ALLOWED_CATEGORIES = \{"service", "product", "media", "work", "other"\}/
  );
});
