(function () {
    "use strict";

    function getPageLanguage() {
        return document.documentElement.lang === "en" ? "en" : "ja";
    }

    function getProductLabels() {
        var pageLanguage = getPageLanguage();

        if (pageLanguage === "en") {
            return {
                emptyMessage: "There are currently no products to display.",
                detailLabel: "Learn more",
                externalLabel: "View public page",
                defaultImageAltSuffix: " image",
                getImageZoomLabel: function (imageAlt) {
                    return "View larger image: " + imageAlt;
                }
            };
        }

        return {
            emptyMessage: "現在、表示できるプロダクトはありません。",
            detailLabel: "詳しく見る",
            externalLabel: "公開ページを見る",
            defaultImageAltSuffix: "のイメージ画像",
            getImageZoomLabel: function (imageAlt) {
                return imageAlt + "を拡大表示";
            }
        };
    }

    function getPublishedProductItems() {
        if (!Array.isArray(window.PRODUCT_ITEMS)) {
            return [];
        }

        return window.PRODUCT_ITEMS
            .filter(function (item) {
                return item && item.published === true;
            })
            .sort(function (a, b) {
                return (a.sortOrder || 0) - (b.sortOrder || 0);
            });
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renderLink(href, label, openInNewTab) {
        var html = "";

        html += '<p class="card-link">';
        html +=     '<a href="' + escapeHtml(href) + '"';

        if (openInNewTab) {
            html += ' target="_blank" rel="noopener noreferrer"';
        }

        html += '>' + escapeHtml(label) + '</a>';
        html += '</p>';

        return html;
    }

    function renderProductCard(item, options) {
        var headingTag = options && options.headingTag ? options.headingTag : "h3";
        var showExternalLink = options && options.showExternalLink === true;
        var labels = getProductLabels();
        var defaultImageAlt = item.name + labels.defaultImageAltSuffix;

        var html = "";

        html += '<article class="card product-card" id="' + escapeHtml(item.id) + '">';

        if (item.imageSrc) {
            var imageAlt = item.imageAlt || defaultImageAlt;
            var imageZoomLabel = labels.getImageZoomLabel(imageAlt);

            html += '<div class="product-card__image">';
            html +=     '<button type="button" class="product-card__image-button" aria-label="' + escapeHtml(imageZoomLabel) + '">';
            html +=         '<img src="' + escapeHtml(item.imageSrc) + '" alt="' + escapeHtml(imageAlt) + '" loading="lazy">';
            html +=     '</button>';
            html += '</div>';
        }

        html +=     '<' + headingTag + '>';
        html +=         '[' + escapeHtml(item.status) + '] ' + escapeHtml(item.name) + '｜' + escapeHtml(item.catch);
        html +=     '</' + headingTag + '>';
        html +=     '<p>' + escapeHtml(item.description) + '</p>';

        if (item.detailUrl) {
            html += renderLink(item.detailUrl, labels.detailLabel, false);
        }

        if (item.infoUrl && item.infoLabel) {
            html += renderLink(item.infoUrl, item.infoLabel, item.infoTargetBlank === true);
        }

        if (showExternalLink && item.externalUrl) {
            html += renderLink(item.externalUrl, labels.externalLabel, true);
        }

        html += '</article>';

        return html;
    }

    function renderTopProducts(containerId) {
        var container = document.getElementById(containerId);
        var labels = getProductLabels();

        if (!container) {
            return;
        }

        var items = getPublishedProductItems()
            .filter(function (item) {
                return item.featured === true;
            })
            .slice(0, 4);

        if (items.length === 0) {
            container.innerHTML = '<p class="products-empty">' + escapeHtml(labels.emptyMessage) + '</p>';
            return;
        }

        var html = items.map(function (item) {
            return renderProductCard(item, {
                headingTag: "h3",
                showExternalLink: false
            });
        }).join("");

        container.innerHTML = html;
    }

    function renderProductsArchive(containerId) {
        var container = document.getElementById(containerId);
        var labels = getProductLabels();

        if (!container) {
            return;
        }

        var items = getPublishedProductItems();

        if (items.length === 0) {
            container.innerHTML = '<p class="products-empty">' + escapeHtml(labels.emptyMessage) + '</p>';
            return;
        }

        var html = items.map(function (item) {
            return renderProductCard(item, {
                headingTag: "h2",
                showExternalLink: true
            });
        }).join("");

        container.innerHTML = html;
    }

    function initializeProductImageModal() {
        var modal = document.getElementById("product-image-modal");
        var modalImage = document.getElementById("product-image-modal-image");

        if (!modal || !modalImage) {
            return;
        }

        function openModal(image) {
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
            var imageButton = event.target.closest(".product-card__image-button");
            var closeButton = event.target.closest("[data-product-image-modal-close]");

            if (imageButton) {
                var image = imageButton.querySelector("img");

                if (image) {
                    openModal(image);
                }

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

    document.addEventListener("DOMContentLoaded", function () {
        renderTopProducts("top-products-list");
        renderProductsArchive("products-archive-list");
        initializeProductImageModal();
    });
})();
