(() => {
  "use strict";

  const STORAGE_KEY = "portfolioIndexLoadingShown";
  const loadingEl = document.getElementById("page-loading");

  if (!loadingEl) {
    return;
  }

  const hideLoading = () => {
    loadingEl.classList.add("is-hidden");
    document.body.classList.remove("is-page-loading");

    window.setTimeout(() => {
      loadingEl.setAttribute("aria-hidden", "true");
    }, 450);
  };

  const hasShown = sessionStorage.getItem(STORAGE_KEY) === "true";

  if (hasShown) {
    loadingEl.classList.add("is-hidden");
    loadingEl.setAttribute("aria-hidden", "true");
    return;
  }

  document.body.classList.add("is-page-loading");
  loadingEl.setAttribute("aria-hidden", "false");
  sessionStorage.setItem(STORAGE_KEY, "true");

  window.addEventListener("load", () => {
    window.setTimeout(() => {
      hideLoading();
    }, 450); // トップページのローディングアニメーションの表示時間の指定。軽快にする場合は値を小さくする。
  });
})();
