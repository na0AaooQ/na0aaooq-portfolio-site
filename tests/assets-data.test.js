const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function loadWindowArray(relativePath, globalName) {
  const filePath = path.join(ROOT_DIR, relativePath);
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    window: {}
  };

  vm.runInNewContext(code, sandbox, {
    filename: relativePath,
    timeout: 1000
  });

  const value = sandbox.window[globalName];

  assert.ok(Array.isArray(value), `${relativePath} should expose window.${globalName}`);

  return value;
}

function isExternalReference(reference) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(reference);
}

function removeQueryAndHash(reference) {
  if (typeof reference !== 'string') {
    return '';
  }

  return reference.split(/[?#]/)[0].trim();
}

function resolveLocalReference(reference, baseDirectory) {
  const cleanReference = removeQueryAndHash(reference);

  if (
    !cleanReference ||
    cleanReference.startsWith('#') ||
    isExternalReference(cleanReference) ||
    /^(?:mailto|tel|javascript|data):/i.test(cleanReference)
  ) {
    return null;
  }

  if (cleanReference.startsWith('/')) {
    return path.join(ROOT_DIR, cleanReference.slice(1));
  }

  return path.resolve(baseDirectory, cleanReference);
}

function assertRequiredString(item, fieldName, label) {
  assert.equal(typeof item[fieldName], 'string', `${label}.${fieldName} should be a string`);
  assert.notEqual(item[fieldName].trim(), '', `${label}.${fieldName} should not be empty`);
}

function assertLocalReferencesExist(items, fields, baseDirectory, label) {
  for (const item of items) {
    for (const field of fields) {
      const localPath = resolveLocalReference(item[field], baseDirectory);

      if (!localPath) {
        continue;
      }

      assert.ok(
        fs.existsSync(localPath),
        `${label} ${item.id} should reference an existing file from ${field}: ${item[field]}`
      );
    }
  }
}

function assertNewsItems(newsItems) {
  assert.ok(newsItems.length > 0, 'news items should not be empty');

  for (const item of newsItems) {
    assertRequiredString(item, 'id', 'news item');
    assertRequiredString(item, 'date', `news item ${item.id}`);
    assertRequiredString(item, 'title', `news item ${item.id}`);
    assertRequiredString(item, 'summary', `news item ${item.id}`);
    assertRequiredString(item, 'url', `news item ${item.id}`);
    assert.equal(
      typeof item.published,
      'boolean',
      `news item ${item.id}.published should be boolean`
    );
    assert.match(item.date, DATE_PATTERN, `news item ${item.id}.date should be YYYY-MM-DD`);
    assert.ok(
      !Number.isNaN(Date.parse(item.date)),
      `news item ${item.id}.date should be parseable`
    );
  }

  assertLocalReferencesExist(newsItems, ['url'], ROOT_DIR, 'news item');
}

function assertProductItems(productItems, label, baseDirectory) {
  assert.ok(productItems.length > 0, `${label} products should not be empty`);

  for (const item of productItems) {
    assertRequiredString(item, 'id', `${label} product`);
    assert.equal(
      typeof item.sortOrder,
      'number',
      `${label} product ${item.id}.sortOrder should be number`
    );
    assertRequiredString(item, 'status', `${label} product ${item.id}`);
    assertRequiredString(item, 'name', `${label} product ${item.id}`);
    assertRequiredString(item, 'catch', `${label} product ${item.id}`);
    assertRequiredString(item, 'description', `${label} product ${item.id}`);
    assert.equal(
      typeof item.published,
      'boolean',
      `${label} product ${item.id}.published should be boolean`
    );
  }

  assertLocalReferencesExist(
    productItems,
    ['detailUrl', 'infoUrl', 'imageSrc'],
    baseDirectory,
    label
  );
}

function sortedIds(items) {
  return Array.from(items, (item) => item.id).sort();
}

test('news data has required fields and local references', () => {
  const newsItems = loadWindowArray('assets/data/news-data.js', 'NEWS_ITEMS');

  assertNewsItems(newsItems);
});

test('English news data has required fields and local references', () => {
  const newsItems = loadWindowArray('assets/data/en/news-data.js', 'NEWS_ITEMS');

  assertNewsItems(newsItems);
});

test('Japanese and English news data include the 2026-08-15 inquiry path update', () => {
  const japaneseNews = loadWindowArray('assets/data/news-data.js', 'NEWS_ITEMS');
  const englishNews = loadWindowArray('assets/data/en/news-data.js', 'NEWS_ITEMS');
  const japaneseUpdate = japaneseNews.find(
    (item) => item.id === '20260815-portfolio-products-inquiry-update'
  );
  const englishUpdate = englishNews.find(
    (item) => item.id === '20260815-portfolio-products-inquiry-update'
  );

  assert.deepEqual(JSON.parse(JSON.stringify(japaneseUpdate)), {
    id: '20260815-portfolio-products-inquiry-update',
    date: '2026-08-15',
    title: '「こころみまもり」の紹介と、お仕事・取材のご相談導線を更新しました',
    summary:
      'ポートフォリオサイトの「プロダクト一覧」ページを更新し、「こころみまもり」の概要を追加しました。あわせて、目指している世界や取り組みに込めた考えをご覧いただける「開発者について」ページへの導線と、お仕事のご依頼や掲載・取材などについてご相談いただける「お問い合わせ」ページへの導線を整えました。また、「お問い合わせ」ページの「お問い合わせ種別」に「お仕事のご依頼について」を追加しました。',
    url: '/news.html#20260815-portfolio-products-inquiry-update',
    relatedUrl: 'products.html',
    relatedLabel: '関連ページを見る',
    published: true
  });
  assert.deepEqual(JSON.parse(JSON.stringify(englishUpdate)), {
    id: '20260815-portfolio-products-inquiry-update',
    date: '2026-08-15',
    title:
      'Updated the “Kokoro Mimamori” introduction and contact options for work and media inquiries',
    summary:
      'The Products page has been updated with a clearer introduction to “Kokoro Mimamori,” along with a link to the About page for more on the vision and ideas behind the initiative. I have also added a clearer contact path for work, project, media, and interview inquiries. In addition, “Work / Project Inquiries” is now available as a new inquiry type on the Contact page.',
    url: '/en/news.html#20260815-portfolio-products-inquiry-update',
    relatedUrl: 'products.html',
    relatedLabel: 'View related page',
    published: true
  });
});

test('product data has required fields and aligned Japanese/English ids', () => {
  const japaneseProducts = loadWindowArray('assets/data/products-data.js', 'PRODUCT_ITEMS');
  const englishProducts = loadWindowArray('assets/data/en/products-data.js', 'PRODUCT_ITEMS');

  assertProductItems(japaneseProducts, 'Japanese', ROOT_DIR);
  assertProductItems(englishProducts, 'English', path.join(ROOT_DIR, 'en'));
  assert.deepEqual(
    sortedIds(englishProducts),
    sortedIds(japaneseProducts),
    'Japanese and English product ids should stay aligned'
  );
});
