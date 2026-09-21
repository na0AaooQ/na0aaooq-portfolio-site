const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EXPECTED_PRODUCT_THEMES = [
  {
    id: 'abusive-language',
    sortOrder: 10,
    labels: { ja: '誹謗中傷・攻撃的言動対策', en: 'Protection from Abusive & Aggressive Language' }
  },
  {
    id: 'harassment',
    sortOrder: 20,
    labels: { ja: 'ハラスメント対策', en: 'Harassment Prevention & Protection' }
  },
  {
    id: 'bullying-group-attacks',
    sortOrder: 30,
    labels: { ja: 'いじめ・集団攻撃対策', en: 'Prevention of Bullying & Group Attacks' }
  },
  {
    id: 'emotional-support',
    sortOrder: 40,
    labels: { ja: '心の負担軽減・支援', en: 'Emotional Support & Relief from Distress' }
  },
  {
    id: 'sensitive-images',
    sortOrder: 50,
    labels: { ja: 'センシティブ画像対策', en: 'Protection from Sensitive Images' }
  },
  {
    id: 'social-posting-safety',
    sortOrder: 60,
    labels: { ja: 'SNS投稿・炎上対策', en: 'Social Media Posting Safety' }
  },
  {
    id: 'official-information-access',
    sortOrder: 70,
    labels: { ja: '公式情報へのアクセス支援', en: 'Access to Official Information' }
  },
  {
    id: 'communication-improvement',
    sortOrder: 80,
    labels: { ja: 'コミュニケーション改善', en: 'Communication Improvement' }
  },
  {
    id: 'analysis-visualization',
    sortOrder: 90,
    labels: { ja: '分析・可視化', en: 'Analysis & Visualization' }
  },
  {
    id: 'other',
    sortOrder: 100,
    labels: { ja: 'その他', en: 'Other' }
  }
];
const EXPECTED_PRODUCT_THEME_ASSIGNMENTS = {
  'kotoba-mimamori': ['social-posting-safety', 'communication-improvement'],
  'gazo-mimamori': ['sensitive-images', 'emotional-support'],
  'na0AaooQ-portfolio-site': ['other'],
  'kotoba-uke-mimamori': ['abusive-language', 'emotional-support'],
  'madoguchi-mimamori': ['official-information-access'],
  'youtube-comment-mimamori': ['abusive-language', 'emotional-support'],
  'kotoba-abuse-support': ['abusive-language', 'emotional-support'],
  'workplace-1on1-harassment-protect': ['harassment', 'abusive-language'],
  'inquiry-mimamori': ['harassment', 'abusive-language', 'emotional-support'],
  'goiken-mimamori': ['abusive-language', 'communication-improvement'],
  'workplace-various-harassment-protect': ['harassment', 'abusive-language'],
  'kotoba-business-pressure': ['harassment', 'abusive-language'],
  'kotoba-school-bullying': ['bullying-group-attacks', 'abusive-language'],
  'kotoba-community-attack': ['bullying-group-attacks', 'abusive-language'],
  'kotoba-structure-analysis': ['analysis-visualization', 'communication-improvement'],
  'kokoro-mental-visualization': ['analysis-visualization', 'emotional-support'],
  'kokoro-support-service': ['emotional-support'],
  'kokoro-training-program': ['communication-improvement'],
  'kokoro-management-report': ['analysis-visualization', 'communication-improvement'],
  'kokoro-society-report': []
};

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

function assertProductThemes(productItems, knownThemeIds, label) {
  const sortOrders = new Set();

  for (const item of productItems) {
    assert.ok(
      Object.hasOwn(item, 'themes'),
      `${label} product ${item.id}.themes should be present`
    );
    assert.ok(Array.isArray(item.themes), `${label} product ${item.id}.themes should be an array`);
    assert.equal(
      new Set(item.themes).size,
      item.themes.length,
      `${label} product ${item.id}.themes should not contain duplicates`
    );

    for (const themeId of item.themes) {
      assert.ok(
        knownThemeIds.has(themeId),
        `${label} product ${item.id} should not use an unknown theme: ${themeId}`
      );
    }

    assert.ok(
      !sortOrders.has(item.sortOrder),
      `${label} product sortOrder should not be duplicated: ${item.sortOrder}`
    );
    sortOrders.add(item.sortOrder);
  }
}

function productThemeAssignments(productItems) {
  return Object.fromEntries(
    productItems.map((item) => [item.id, JSON.parse(JSON.stringify(item.themes))])
  );
}

test('news data has required fields and local references', () => {
  const newsItems = loadWindowArray('assets/data/news-data.js', 'NEWS_ITEMS');

  assertNewsItems(newsItems);
});

test('English news data has required fields and local references', () => {
  const newsItems = loadWindowArray('assets/data/en/news-data.js', 'NEWS_ITEMS');

  assertNewsItems(newsItems);
});

test('Japanese and English news data include the 2026-09-21 product and business policy update', () => {
  const japaneseNews = loadWindowArray('assets/data/news-data.js', 'NEWS_ITEMS');
  const englishNews = loadWindowArray('assets/data/en/news-data.js', 'NEWS_ITEMS');
  const japaneseUpdate = japaneseNews.find(
    (item) => item.id === '20260921-portfolio-products-and-business-policy-update'
  );
  const englishUpdate = englishNews.find(
    (item) => item.id === '20260921-portfolio-products-and-business-policy-update'
  );

  assert.deepEqual(JSON.parse(JSON.stringify(japaneseUpdate)), {
    id: '20260921-portfolio-products-and-business-policy-update',
    date: '2026-09-21',
    title: '「プロダクト一覧」に対応テーマによる絞り込みを追加し、事業姿勢と掲載情報を更新しました',
    summary:
      'ポートフォリオサイトを更新し、「プロダクト一覧」に各プロダクトを対応テーマから探せる絞り込み機能を追加しました。あわせて、トップページ・「プロダクト一覧」・「開発者について」に、個人事業「こころみまもり」の法令遵守および反社会的勢力との関係を持たない事業姿勢を明記しました。また、「まどぐちみまもり」の掲載情報と紹介画像を現在の内容に更新しました。',
    url: '/news.html#20260921-portfolio-products-and-business-policy-update',
    relatedUrl: 'products.html',
    relatedLabel: '関連ページを見る',
    published: true
  });
  assert.deepEqual(JSON.parse(JSON.stringify(englishUpdate)), {
    id: '20260921-portfolio-products-and-business-policy-update',
    date: '2026-09-21',
    title:
      'Added theme filtering to the Products page and updated business policies and product information',
    summary:
      'The portfolio website has been updated with a theme filter on the Products page to help visitors find relevant products more easily. The Home, Products, and About pages now also state the business policies of the “Kokoro Mimamori” sole proprietorship, including compliance with applicable laws and regulations and no relationships or transactions with organized crime groups or other antisocial forces. In addition, the listing information and introduction image for Madoguchi Mimamori have been updated to reflect its current scope.',
    url: '/en/news.html#20260921-portfolio-products-and-business-policy-update',
    relatedUrl: 'products.html',
    relatedLabel: 'View related page',
    published: true
  });
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
  const productThemes = loadWindowArray('assets/data/product-themes.js', 'PRODUCT_THEMES');
  const knownThemeIds = new Set(productThemes.map((theme) => theme.id));

  assertProductItems(japaneseProducts, 'Japanese', ROOT_DIR);
  assertProductItems(englishProducts, 'English', path.join(ROOT_DIR, 'en'));
  assert.deepEqual(JSON.parse(JSON.stringify(productThemes)), EXPECTED_PRODUCT_THEMES);
  assertProductThemes(japaneseProducts, knownThemeIds, 'Japanese');
  assertProductThemes(englishProducts, knownThemeIds, 'English');
  assert.deepEqual(productThemeAssignments(japaneseProducts), EXPECTED_PRODUCT_THEME_ASSIGNMENTS);
  assert.deepEqual(productThemeAssignments(englishProducts), EXPECTED_PRODUCT_THEME_ASSIGNMENTS);
  assert.deepEqual(
    JSON.parse(JSON.stringify(japaneseProducts.find((item) => item.id === 'madoguchi-mimamori'))),
    {
      id: 'madoguchi-mimamori',
      sortOrder: 42,
      themes: ['official-information-access'],
      status: '公開中',
      name: 'まどぐちみまもり',
      catch: '公的機関・関係団体の公式情報案内',
      description:
        '「まどぐちみまもり」は、災害時などに確認したい内容から担当する公的機関・関係団体を見つけ、その団体自身の公式発表へ進むための案内サイトです。行政機関が運営する公式サイト、速報サイト、情報の真偽判定サービスではありません。',
      detailUrl: 'products.html#madoguchi-mimamori',
      infoUrl: 'https://madoguchi.kokoromimamori.na0aaooq.com/ja/privacy/',
      infoLabel: 'プライバシーポリシーを見る',
      infoTargetBlank: true,
      videoUrl: 'https://youtu.be/FP5AdvQiGJ0?si=Lx1wdZRxDenPyhIO',
      videoLabel: 'サービス紹介動画を見る',
      videoTargetBlank: true,
      externalUrl: 'https://madoguchi.kokoromimamori.na0aaooq.com/ja/',
      imageSrc: 'assets/img/products/madoguchi-mimamori-thumb.png',
      imageAlt: 'まどぐちみまもりの紹介画像',
      featured: true,
      published: true
    }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(englishProducts.find((item) => item.id === 'madoguchi-mimamori'))),
    {
      id: 'madoguchi-mimamori',
      sortOrder: 42,
      themes: ['official-information-access'],
      status: 'Available',
      name: 'Madoguchi Mimamori',
      catch: 'Guide to Official Information from Public Institutions and Related Organizations',
      description:
        "Madoguchi Mimamori is a guide that helps users find the public institution or related organization responsible for the information they need during disasters and other situations, then continue to that organization's own official announcements. It is not an official government website, breaking-news service, news site, or fact-checking service.",
      detailUrl: 'products.html#madoguchi-mimamori',
      infoUrl: 'https://madoguchi.kokoromimamori.na0aaooq.com/en/privacy/',
      infoLabel: 'View privacy policy',
      infoTargetBlank: true,
      videoUrl: 'https://youtu.be/FP5AdvQiGJ0?si=Lx1wdZRxDenPyhIO',
      videoLabel: 'Watch service video',
      videoTargetBlank: true,
      externalUrl: 'https://madoguchi.kokoromimamori.na0aaooq.com/en/',
      imageSrc: '../assets/img/products/madoguchi-mimamori-thumb.png',
      imageAlt: 'Madoguchi Mimamori introduction image',
      featured: true,
      published: true
    }
  );
  assert.deepEqual(
    sortedIds(englishProducts),
    sortedIds(japaneseProducts),
    'Japanese and English product ids should stay aligned'
  );
});
