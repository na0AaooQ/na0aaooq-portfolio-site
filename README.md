# na0aaooq-portfolio-site

na0AaooQ(青木直之)のポートフォリオサイトのソースコード  

個人開発のポートフォリオサイト用リポジトリです。  
公開中のポートフォリオサイト本体の HTML / CSS / JavaScript、および関連する静的ファイルを管理しています。

- 公開URL: https://portfolio.na0aaooq.com/
- Repository: https://github.com/na0AaooQ/na0aaooq-portfolio-site

---

## Overview

このリポジトリでは、以下を掲載するポートフォリオサイトのソースコードを管理しています。

- 開発者情報
- 個人開発中のプロダクト
- お知らせ / 更新情報
- お問い合わせ
- 英語ページ
- 各種ポリシーページ

日本語ページに加えて、英語ページも段階的に整備しています。

---

## Tech Stack

- HTML / CSS / JavaScript
- Amazon S3
- Amazon CloudFront
- ACM
- Google Analytics 4
- Google Search Console
- API Gateway
- AWS Lambda
- Amazon SES
- Google reCAPTCHA Enterprise

---

## Main Features

- 日本語 / 英語ページ対応
- お問い合わせフォーム
- 送信時ローディング表示
- 404ページ
- 現在地表示付きグローバルナビ
- 基本的な SEO 対応
  - title / meta description
  - canonical
  - OGP / Twitter Card
  - JSON-LD
  - hreflang

---

## Directory Structure

```text
.
├── index.html
├── about.html
├── products.html
├── news.html
├── contact.html
├── privacy.html
├── usage.html
├── disclaimer.html
├── sitemap.html
├── 404.html
├── robots.txt
├── sitemap.xml
│
├── en/
│   ├── index.html
│   ├── about.html
│   ├── products.html
│   ├── news.html
│   ├── contact.html
│   ├── privacy.html
│   ├── usage.html
│   ├── disclaimer.html
│   └── sitemap.html
│
├── assets/
│   ├── css/
│   ├── js/
│   ├── data/
│   └── img/
│
├── deploy_portfolio_site.sh
├── .gitignore
├── .env.example
├── .env
```

---

## Notes

このリポジトリは、汎用テンプレートというより、  
実運用中のポートフォリオサイトを継続改善していくためのソース管理 を目的としています。  

---

## Deployment

デプロイには deploy_portfolio_site.sh を使用しています。
ローカル環境でソースコード類の変更やテストをした後、ソースコード類に差分がある場合、S3バケットへファイルを反映する運用です。

デプロイスクリプトを実行する前に、.envファイルを作成し、
.envファイル内の PORTFOLIO_SITE_S3_BUKKET_NAME 環境変数にデプロイ先のS3バケット名を記載します。

```
cp -p .env.example .env
```

```
vi .env
```

```
# na0AaooQ(青木直之)のポートフォリオサイトのデプロイスクリプト
#
# デプロイ先のS3バケット名を記載する
#   PORTFOLIO_SITE_S3_BUKKET_NAME="s3://xxxxxxxxxxxxxxx
PORTFOLIO_SITE_S3_BUKKET_NAME="s3://xxxxxxxxxxxxxxx"
```

その後、デプロイスクリプトを実行すると、S3バケットに反映されます。

```
./deploy_portfolio_site.sh
S3バケット [s3://xxxxxxxxxxxxxxx-ap-northeast-1-an] へのデプロイを開始します。
S3バケット [s3://xxxxxxxxxxxxxxx-ap-northeast-1-an] へデプロイする対象ファイルです。
(dryrun) upload: ./about.html to s3://xxxxxxxxxxxxxxx-ap-northeast-1-an/about.html
(dryrun) upload: en/about.html to s3://xxxxxxxxxxxxxxx-ap-northeast-1-an/en/about.html
S3バケットへのデプロイを実行しますか？ [y/N]: y
S3バケット [s3://xxxxxxxxxxxxxxx-ap-northeast-1-an] へデプロイします。
upload: ./about.html to s3://xxxxxxxxxxxxxxx-ap-northeast-1-an/about.html
upload: en/about.html to s3://xxxxxxxxxxxxxxx-ap-northeast-1-an/en/about.html
```

---

## Author

Naohisa Aoki (na0AaooQ)  
• X: https://x.com/na0AaooQ  
• Qiita: https://qiita.com/na0AaooQ  
• Portfolio Site: https://portfolio.na0aaooq.com/  
