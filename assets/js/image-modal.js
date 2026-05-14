(function () {
  "use strict";

  function initializeImageModal() {
    var modal = document.getElementById("product-image-modal");
    var modalImage = document.getElementById("product-image-modal-image");

    if (!modal || !modalImage) {
      return;
    }

    function openModal(button) {
      var image = button.querySelector("img");

      if (!image) {
        return;
      }

      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt || "";
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-product-image-modal-open");
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-product-image-modal-open");
      modalImage.src = "";
      modalImage.alt = "";
    }

    document.addEventListener("click", function (event) {
      var imageButton = event.target.closest("[data-image-modal-trigger]");
      var closeButton = event.target.closest("[data-product-image-modal-close]");

      if (imageButton) {
        openModal(imageButton);
        return;
      }

      if (closeButton) {
        closeModal();
      }
    });

    modalImage.addEventListener("click", closeModal);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initializeImageModal);
})();
