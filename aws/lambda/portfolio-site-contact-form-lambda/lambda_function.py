# portfolio-site-contact-form-lambda
# ポートフォリオサイトのお問い合わせ画面から問い合わせがあった場合、
# Lambda環境変数で定義したメールアドレス宛に、Amazon SES経由で通知メールを送信する
import json
import os
import logging
import urllib.parse
import urllib.request
from email.utils import parseaddr
import re

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ses = boto3.client("ses", region_name=os.environ.get("SES_REGION", "ap-northeast-1"))

MAIL_FROM = os.environ["MAIL_FROM"]
MAIL_TO = os.environ["MAIL_TO"]
RECAPTCHA_SECRET = os.environ["RECAPTCHA_SECRET"]
RECAPTCHA_VERIFY_URL = os.environ.get(
    "RECAPTCHA_VERIFY_URL",
    "https://www.google.com/recaptcha/api/siteverify"
)

ALLOWED_CATEGORIES = {"service", "product", "media", "other"}

BLOCKED_PATTERNS = [
    re.compile(r"<\s*script\b", re.IGNORECASE),
    re.compile(r"<\s*/\s*script\s*>", re.IGNORECASE),
    re.compile(r"javascript\s*:", re.IGNORECASE),
    re.compile(r"onerror\s*=", re.IGNORECASE),
    re.compile(r"onload\s*=", re.IGNORECASE),
    re.compile(r"onclick\s*=", re.IGNORECASE),
    re.compile(r"<\s*iframe\b", re.IGNORECASE),
    re.compile(r"<\s*object\b", re.IGNORECASE),
    re.compile(r"<\s*embed\b", re.IGNORECASE),
    re.compile(r"<\s*svg\b", re.IGNORECASE),
    re.compile(r"<\s*img\b", re.IGNORECASE),
    re.compile(r"data\s*:\s*text/html", re.IGNORECASE),
]


def contains_blocked_markup(value: str) -> bool:
    if not value:
        return False
    return any(pattern.search(value) for pattern in BLOCKED_PATTERNS)


def build_response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(body, ensure_ascii=False)
    }


def is_valid_email(value: str) -> bool:
    if not value:
        return False
    _, addr = parseaddr(value)
    return "@" in addr and "." in addr.split("@")[-1]


def normalize_text(value: str) -> str:
    return (value or "").replace("\r\n", "\n").strip()


def has_meaningful_text(value: str) -> bool:
    return len(normalize_text(value)) > 0


def verify_recaptcha(token: str) -> dict:
    payload = urllib.parse.urlencode({
        "secret": RECAPTCHA_SECRET,
        "response": token
    }).encode("utf-8")

    request = urllib.request.Request(
        RECAPTCHA_VERIFY_URL,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        }
    )

    with urllib.request.urlopen(request, timeout=10) as response:
        response_body = response.read().decode("utf-8")
        return json.loads(response_body)


def lambda_handler(event, context):
    logger.info("Contact form request received")

    try:
        body_raw = event.get("body") or "{}"
        body = json.loads(body_raw)
    except Exception:
        logger.exception("Failed to parse request body")
        return build_response(
            400,
            {
                "message": "リクエスト形式が不正です。"
            }
        )

    lang = "en" if (body.get("lang") or "").lower() == "en" else "ja"

    def msg(ja_text: str, en_text: str) -> str:
        return en_text if lang == "en" else ja_text

    name = normalize_text(body.get("name") or "")
    email = normalize_text(body.get("email") or "")
    category = (body.get("category") or "").strip()
    message = normalize_text(body.get("message") or "")
    privacy_agree = body.get("privacyAgree")
    recaptcha_token = normalize_text(body.get("recaptchaToken") or "")

    errors = []

    if not has_meaningful_text(name):
        errors.append(msg("お名前は必須です。", "Name is required."))
    elif len(name) > 100:
        errors.append(msg("お名前は100文字以内で入力してください。", "Name must be 100 characters or fewer."))
    if contains_blocked_markup(name):
        errors.append(msg("お名前に使用できない文字列が含まれています。", "Your name contains unsupported content."))

    if contains_blocked_markup(message):
        errors.append(
            msg(
                "お問い合わせ内容に使用できない文字列が含まれています。",
                "Your message contains unsupported content."
            )
        )

    if not has_meaningful_text(email):
        errors.append(msg("メールアドレスは必須です。", "Email address is required."))
    elif len(email) > 254:
        errors.append(
            msg(
                "メールアドレスは254文字以内で入力してください。",
                "Email address must be 254 characters or fewer."
            )
        )
    elif not is_valid_email(email):
        errors.append(msg("メールアドレスの形式が不正です。", "Email address format is invalid."))

    if category not in ALLOWED_CATEGORIES:
        errors.append(msg("お問い合わせ種別が不正です。", "Inquiry type is invalid."))

    if not has_meaningful_text(message):
        errors.append(msg("お問い合わせ内容は必須です。", "Message is required."))
    elif len(message) > 5000:
        errors.append(
            msg(
                "お問い合わせ内容は5000文字以内で入力してください。",
                "Message must be 5000 characters or fewer."
            )
        )

    if privacy_agree is not True:
        errors.append(
            msg(
                "プライバシーポリシーへの同意が必要です。",
                "You must agree to the Privacy Policy."
            )
        )

    if not has_meaningful_text(recaptcha_token):
        errors.append(
            msg(
                "reCAPTCHA の検証が必要です。",
                "reCAPTCHA verification is required."
            )
        )

    if errors:
        logger.info(
            "Validation failed: lang=%s category=%s name_length=%s email_length=%s message_length=%s error_count=%s",
            lang,
            category,
            len(name),
            len(email),
            len(message),
            len(errors)
        )
        return build_response(
            400,
            {
                "message": msg(
                    "入力内容に不備があります。",
                    "There are issues with the information you entered."
                ),
                "errors": errors
            }
        )

    try:
        recaptcha_result = verify_recaptcha(recaptcha_token)
        logger.info(
            "reCAPTCHA verify result: lang=%s success=%s error-codes=%s",
            lang,
            recaptcha_result.get("success"),
            recaptcha_result.get("error-codes")
        )
    except Exception:
        logger.exception("Failed to verify reCAPTCHA")
        return build_response(
            500,
            {
                "message": msg(
                    "reCAPTCHA の検証に失敗しました。",
                    "Failed to verify reCAPTCHA."
                )
            }
        )

    if not recaptcha_result.get("success"):
        logger.info(
            "reCAPTCHA rejected: lang=%s error_codes=%s",
            lang,
            recaptcha_result.get("error-codes")
        )
        return build_response(
            400,
            {
                "message": msg(
                    "reCAPTCHA の確認に失敗しました。もう一度お試しください。",
                    "reCAPTCHA verification failed. Please try again."
                )
            }
        )

    subject = f"[Portfolio Contact] {category}"

    text_body = f"""ポートフォリオサイトからお問い合わせがありました。

【お名前 / ハンドルネーム】
{name}

【メールアドレス】
{email}

【お問い合わせ種別】
{category}

【お問い合わせ内容】
{message}

【言語】
{lang}
"""

    try:
        ses.send_email(
            Source=MAIL_FROM,
            Destination={
                "ToAddresses": [MAIL_TO]
            },
            Message={
                "Subject": {
                    "Data": subject,
                    "Charset": "UTF-8"
                },
                "Body": {
                    "Text": {
                        "Data": text_body,
                        "Charset": "UTF-8"
                    }
                }
            }
        )
        logger.info(
            "Mail sent successfully: lang=%s category=%s name_length=%s message_length=%s",
            lang,
            category,
            len(name),
            len(message)
        )

    except Exception:
        logger.exception("Failed to send email via SES")
        return build_response(
            500,
            {
                "message": msg(
                    "送信処理に失敗しました。時間をおいて再度お試しください。",
                    "Failed to send your message. Please try again later."
                )
            }
        )

    return build_response(
        200,
        {
            "message": msg(
                "お問い合わせを受け付けました。",
                "Your message has been received."
            )
        }
    )
