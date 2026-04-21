(() => {
  "use strict";

  const API_ENDPOINT = "/prod/contact";

  const form = document.getElementById("contact-form");
  const statusEl = document.getElementById("form-status");
  const submitButton = document.getElementById("contact-submit-button");
  const messageInput = document.getElementById("message");
  const messageCountEl = document.getElementById("message-count");

  if (!form || !statusEl || !submitButton || !messageInput || !messageCountEl) {
    return;
  }

  const pageLang = (document.documentElement.lang || "ja").toLowerCase();
  const isEnglish = pageLang.startsWith("en");

  const messages = isEnglish
    ? {
        submit: "Send Message",
        submitting: "Sending...",
        loading: "Sending your message...",
        success: "Your message has been received.",
        networkError: "Failed to connect. Please try again later.",
        invalidInput: "Please review the information you entered.",
        rateLimit: "Too many requests are being made. Please try again later.",
        sendError: "Failed to send your message. Please try again later.",
        nameRequired: "Please enter your name.",
        nameTooLong: "Your name must be 100 characters or fewer.",
        nameBlocked: "Your name contains unsupported content.",
        messageBlocked: "Your message contains unsupported content.",
        emailRequired: "Please enter your email address.",
        emailTooLong: "Your email address must be 254 characters or fewer.",
        emailInvalid: "Please enter a valid email address.",
        categoryRequired: "Please select an inquiry type.",
        messageRequired: "Please enter your message.",
        messageTooLong: "Your message must be 5000 characters or fewer.",
        privacyRequired: "You must agree to the Privacy Policy.",
        recaptchaRequired: "Please complete the reCAPTCHA check."
      }
    : {
        submit: "送信する",
        submitting: "送信中...",
        loading: "お問い合わせを送信しています。",
        success: "お問い合わせを受け付けました。",
        networkError: "通信に失敗しました。時間をおいて再度お試しください。",
        invalidInput: "入力内容をご確認ください。",
        rateLimit: "アクセスが集中しています。少し時間をおいて再度お試しください。",
        sendError: "送信に失敗しました。時間をおいて再度お試しください。",
        nameRequired: "お名前 / ハンドルネームを入力してください。",
        nameTooLong: "お名前 / ハンドルネームは100文字以内で入力してください。",
        nameBlocked: "お名前 / ハンドルネームに使用できない文字列が含まれています。",
        messageBlocked: "お問い合わせ内容に使用できない文字列が含まれています。",
        emailRequired: "メールアドレスを入力してください。",
        emailTooLong: "メールアドレスは254文字以内で入力してください。",
        emailInvalid: "メールアドレスの形式が正しくありません。",
        categoryRequired: "お問い合わせ種別を選択してください。",
        messageRequired: "お問い合わせ内容を入力してください。",
        messageTooLong: "お問い合わせ内容は5000文字以内で入力してください。",
        privacyRequired: "プライバシーポリシーへの同意が必要です。",
        recaptchaRequired: "reCAPTCHA の確認を完了してください。"
      };

  function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = "form-status";
    if (type) {
      statusEl.classList.add(`is-${type}`);
    }
  }

  function showLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) {
      return;
    }

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-loading");
  }

  function hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) {
      return;
    }

    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-loading");
  }

  function setSubmitButtonLoadingState(isLoading) {
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = messages.submitting;
      submitButton.setAttribute("aria-busy", "true");
      return;
    }

    submitButton.disabled = false;
    submitButton.textContent = messages.submit;
    submitButton.setAttribute("aria-busy", "false");
  }

  function normalizeText(value) {
    return (value || "").replace(/\r\n/g, "\n").trim();
  }

  // 問い合わせ本文の入力文字数のカウンター用
  function updateMessageCounter() {
    const currentLength = messageInput.value.length;
    const maxLength = Number(messageInput.getAttribute("maxlength")) || 5000;

    messageCountEl.textContent = `${currentLength} / ${maxLength}`;
  }

  function hasMeaningfulText(value) {
    return normalizeText(value).length > 0;
  }

  function getRecaptchaToken() {
    if (
      !window.grecaptcha ||
      !window.grecaptcha.enterprise ||
      typeof window.grecaptcha.enterprise.getResponse !== "function"
    ) {
      return "";
    }
    return window.grecaptcha.enterprise.getResponse();
  }

  function resetRecaptcha() {
    if (
      window.grecaptcha &&
      window.grecaptcha.enterprise &&
      typeof window.grecaptcha.enterprise.reset === "function"
    ) {
      window.grecaptcha.enterprise.reset();
    }
  }

  function getFormData() {
    const name = normalizeText(document.getElementById("name")?.value || "");
    const email = normalizeText(document.getElementById("email")?.value || "");
    const category = document.getElementById("category")?.value || "";
    const message = normalizeText(document.getElementById("message")?.value || "");
    const privacyAgree = document.getElementById("privacy_agree")?.checked || false;
    const recaptchaToken = getRecaptchaToken();

    return {
      name,
      email,
      category,
      message,
      privacyAgree,
      recaptchaToken,
      lang: isEnglish ? "en" : "ja"
    };
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function containsBlockedMarkup(value) {
    const blockedPatterns = [
      /<\s*script\b/i,
      /<\s*\/\s*script\s*>/i,
      /javascript\s*:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /onclick\s*=/i,
      /<\s*iframe\b/i,
      /<\s*object\b/i,
      /<\s*embed\b/i,
      /<\s*svg\b/i,
      /<\s*img\b/i,
      /data\s*:\s*text\/html/i
    ];

    return blockedPatterns.some((pattern) => pattern.test(value || ""));
  }

  function validateForm(data) {
    if (!hasMeaningfulText(data.name)) {
      return messages.nameRequired;
    }
    if (data.name.length > 100) {
      return messages.nameTooLong;
    }
    if (containsBlockedMarkup(data.name)) {
      return messages.nameBlocked;
    }
    if (containsBlockedMarkup(data.message)) {
      return messages.messageBlocked;
    }
    if (!hasMeaningfulText(data.email)) {
      return messages.emailRequired;
    }
    if (data.email.length > 254) {
      return messages.emailTooLong;
    }
    if (!validateEmail(data.email)) {
      return messages.emailInvalid;
    }
    if (!data.category) {
      return messages.categoryRequired;
    }
    if (!hasMeaningfulText(data.message)) {
      return messages.messageRequired;
    }
    if (data.message.length > 5000) {
      return messages.messageTooLong;
    }
    if (!data.privacyAgree) {
      return messages.privacyRequired;
    }
    if (!data.recaptchaToken) {
      return messages.recaptchaRequired;
    }

    return "";
  }

  async function submitContactForm(data) {
    let response;

    try {
      response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      throw new Error(messages.networkError);
    }

    let result = {};
    try {
      result = await response.json();
    } catch (error) {
      result = {};
    }

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(result.message || messages.invalidInput);
      }

      if (response.status === 429) {
        throw new Error(result.message || messages.rateLimit);
      }

      throw new Error(result.message || messages.sendError);
    }

    return result;
  }

  submitButton.textContent = messages.submit;

  updateMessageCounter();

  messageInput.addEventListener("input", () => {
    updateMessageCounter();
  });


  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = getFormData();
    const validationMessage = validateForm(formData);

    if (validationMessage) {
      setStatus(validationMessage, "error");
      return;
    }

    setSubmitButtonLoadingState(true);
    showLoading();
    setStatus(messages.loading, "loading");

    try {
      const result = await submitContactForm(formData);
      setStatus(result.message || messages.success, "success");
      form.reset();
      updateMessageCounter();
      resetRecaptcha();
    } catch (error) {
      setStatus(error.message || messages.sendError, "error");
      resetRecaptcha();
    } finally {
      hideLoading();
      setSubmitButtonLoadingState(false);
    }
  });
})();
