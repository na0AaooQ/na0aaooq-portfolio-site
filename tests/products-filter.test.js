const assert = require('node:assert/strict');
const test = require('node:test');

const { getFilteredProductItems } = require('../assets/products.js');

const THEMES = [
  { id: 'abusive-language' },
  { id: 'communication-improvement' },
  { id: 'other' },
  { id: 'no-results' }
];

const PRODUCTS = [
  {
    id: 'unpublished',
    sortOrder: 5,
    themes: ['abusive-language'],
    published: false
  },
  {
    id: 'abusive-only',
    sortOrder: 10,
    themes: ['abusive-language'],
    published: true
  },
  {
    id: 'multiple-themes',
    sortOrder: 20,
    themes: ['abusive-language', 'communication-improvement'],
    published: true
  },
  {
    id: 'unclassified',
    sortOrder: 30,
    themes: [],
    published: true
  },
  {
    id: 'other-theme',
    sortOrder: 40,
    themes: ['other'],
    published: true
  }
];

function ids(items) {
  return items.map((item) => item.id);
}

test('all themes returns every published product once in sort order', () => {
  const result = getFilteredProductItems(PRODUCTS, '', THEMES);

  assert.deepEqual(ids(result), ['abusive-only', 'multiple-themes', 'unclassified', 'other-theme']);
  assert.equal(new Set(ids(result)).size, result.length);
});

test('a selected theme returns each matching product without duplicates', () => {
  assert.deepEqual(ids(getFilteredProductItems(PRODUCTS, 'abusive-language', THEMES)), [
    'abusive-only',
    'multiple-themes'
  ]);
  assert.deepEqual(ids(getFilteredProductItems(PRODUCTS, 'communication-improvement', THEMES)), [
    'multiple-themes'
  ]);
});

test('unclassified products appear only when all themes are selected', () => {
  assert.deepEqual(ids(getFilteredProductItems(PRODUCTS, '', THEMES)), [
    'abusive-only',
    'multiple-themes',
    'unclassified',
    'other-theme'
  ]);
  assert.ok(
    !ids(getFilteredProductItems(PRODUCTS, 'abusive-language', THEMES)).includes('unclassified')
  );
});

test('other is a theme and does not include unclassified products', () => {
  assert.deepEqual(ids(getFilteredProductItems(PRODUCTS, 'other', THEMES)), ['other-theme']);
});

test('a valid theme with no products returns an empty result without resetting the selection', () => {
  assert.deepEqual(ids(getFilteredProductItems(PRODUCTS, 'no-results', THEMES)), []);
});

test('an invalid selected theme safely falls back to all themes', () => {
  assert.doesNotThrow(() => getFilteredProductItems(PRODUCTS, 'unknown-theme', THEMES));
  assert.deepEqual(
    ids(getFilteredProductItems(PRODUCTS, 'unknown-theme', THEMES)),
    ids(getFilteredProductItems(PRODUCTS, '', THEMES))
  );
});

test('an unavailable theme source still returns all published products', () => {
  assert.deepEqual(
    ids(getFilteredProductItems(PRODUCTS, 'abusive-language', undefined)),
    ids(getFilteredProductItems(PRODUCTS, '', THEMES))
  );
});
