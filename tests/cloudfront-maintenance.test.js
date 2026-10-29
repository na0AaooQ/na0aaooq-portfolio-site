const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const FUNCTION_PATH = path.join(
  __dirname,
  '../aws/cloudfront/functions/portfolio-site-maintenance.js'
);
const source = fs.readFileSync(FUNCTION_PATH, 'utf8');
const sandbox = {};

vm.runInNewContext(source, sandbox, { filename: FUNCTION_PATH, timeout: 1000 });

function invokeHandler(method = 'GET', uri = '/') {
  return sandbox.handler({
    request: { method, uri, querystring: {}, headers: {}, cookies: {} }
  });
}

test('CF-01: GET / returns 503 and the bilingual maintenance HTML', () => {
  const response = invokeHandler();

  assert.equal(response.statusCode, 503);
  assert.equal(response.statusDescription, 'Service Unavailable');
  assert.match(response.body, /^<!DOCTYPE html>[\s\S]*<\/html>$/);
  assert.ok(response.body.includes('現在、システムメンテナンス中です。'));
  assert.ok(response.body.includes('This site is temporarily unavailable due to maintenance.'));
});

test('CF-02: Japanese and English HTML paths return the same maintenance HTML', () => {
  const rootBody = invokeHandler().body;

  for (const uri of ['/index.html', '/en/index.html']) {
    const response = invokeHandler('GET', uri);

    assert.equal(response.statusCode, 503);
    assert.equal(response.body, rootBody);
  }
});

test('CF-03: static assets and missing paths return the same maintenance HTML', () => {
  const rootBody = invokeHandler().body;

  for (const uri of ['/assets/img/common/favicon.png', '/not-found.html']) {
    const response = invokeHandler('GET', uri);

    assert.equal(response.statusCode, 503);
    assert.equal(response.body, rootBody);
  }
});

test('CF-04: HEAD / returns 503 with an empty body', () => {
  const response = invokeHandler('HEAD');

  assert.equal(response.statusCode, 503);
  assert.equal(response.statusDescription, 'Service Unavailable');
  assert.equal(response.body, '');
});

test('CF-05: GET and HEAD return exactly the seven agreed response headers', () => {
  const expectedHeaders = {
    'content-type': { value: 'text/html; charset=utf-8' },
    'cache-control': { value: 'no-store' },
    'x-content-type-options': { value: 'nosniff' },
    'referrer-policy': { value: 'no-referrer' },
    'x-frame-options': { value: 'DENY' },
    'strict-transport-security': { value: 'max-age=31536000' },
    'content-security-policy': {
      value:
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    }
  };

  for (const method of ['GET', 'HEAD']) {
    const { headers } = invokeHandler(method);

    assert.deepEqual(JSON.parse(JSON.stringify(headers)), expectedHeaders);
    assert.equal(headers['retry-after'], undefined);
    assert.equal(headers['content-length'], undefined);
  }
});

test('CF-06: HTML includes the agreed copy, title, language and metadata', () => {
  const { body } = invokeHandler();

  for (const text of [
    'na0AaooQ ポートフォリオサイト',
    'na0AaooQ Portfolio',
    '現在、システムメンテナンス中です。',
    'ご不便をおかけいたしますが、しばらく時間をおいてから再度アクセスしてください。',
    'This site is temporarily unavailable due to maintenance.',
    'We apologize for the inconvenience. Please try again later.'
  ]) {
    assert.ok(body.includes(text), `HTML should include: ${text}`);
  }

  assert.match(body, /<html lang="ja">/);
  assert.match(body, /<p[^>]*lang="en">na0AaooQ Portfolio<\/p>/);
  assert.match(
    body,
    /<section[^>]*lang="en">[\s\S]*?<h2>This site is temporarily unavailable due to maintenance\.<\/h2>[\s\S]*?<p>We apologize for the inconvenience\. Please try again later\.<\/p>[\s\S]*?<\/section>/
  );
  assert.match(body, /<meta charset="UTF-8">/);
  assert.match(body, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(body, /<title>メンテナンス中 \| na0AaooQ ポートフォリオサイト<\/title>/);
});

test('CF-07: URI, query string, headers and cookies do not affect the HTML', () => {
  const marker = 'CF_INPUT_DO_NOT_REFLECT';
  const response = sandbox.handler({
    request: {
      method: 'GET',
      uri: `/${marker}`,
      querystring: { input: { value: marker } },
      headers: {
        'x-test-input': { value: marker },
        'accept-language': { value: 'en' }
      },
      cookies: { input: { value: marker } }
    }
  });

  assert.equal(response.statusCode, 503);
  assert.equal(response.body, invokeHandler().body);
  assert.ok(!response.body.includes(marker));
});

test('CF-08: HTML has no external assets, scripts, forms or redirects', () => {
  const { body } = invokeHandler();

  assert.doesNotMatch(
    body,
    /<(?:link|script|img|picture|iframe|object|embed|form|audio|video|source|base)\b/i
  );
  assert.doesNotMatch(body, /\b(?:src|srcset|href|action|ping|http-equiv|on[a-z]+)\s*=/i);
  assert.doesNotMatch(body, /@import\b|url\s*\(|https?:\/\//i);
});

test('CF-09: production HTML has no test-only maintenance message', () => {
  assert.ok(!invokeHandler().body.includes('[システムメンテナンスのテストです]'));
});

test('CF-10: UTF-8 function source fits within 10 KB', () => {
  const size = Buffer.byteLength(source, 'utf8');

  assert.ok(size <= 10 * 1024, `Function source is ${size} bytes; limit is 10240`);
});
