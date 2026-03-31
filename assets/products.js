(function () {
    "use strict";

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

    function renderProductCard(item, options) {
        var headingTag = options && options.headingTag ? options.headingTag : "h3";
        var showExternalLink = options && options.showExternalLink === true;

        var html = "";

        html += '<article class="card product-card" id="' + escapeHtml(item.id) + '">';

        if (item.imageSrc) {
            html += '<div class="product-card__image">';
            html +=     '<img src="' + escapeHtml(item.imageSrc) + '" alt="' + escapeHtml(item.imageAlt || (item.name + "のイメージ画像")) + '" loading="lazy">';
            html += '</div>';
        }

        html +=     '<' + headingTag + '>';
        html +=         '[' + escapeHtml(item.status) + '] ' + escapeHtml(item.name) + '｜' + escapeHtml(item.catch);
        html +=     '</' + headingTag + '>';
        html +=     '<p>' + escapeHtml(item.description) + '</p>';
        html +=     '<p class="card-link">';
        html +=         '<a href="' + escapeHtml(item.detailUrl) + '">詳しく見る</a>';
        html +=     '</p>';

        if (showExternalLink && item.externalUrl) {
            html += '<p class="card-link">';
            html +=     '<a href="' + escapeHtml(item.externalUrl) + '" target="_blank" rel="noopener noreferrer">公開ページを見る</a>';
            html += '</p>';
        }

        html += '</article>';

        return html;
    }

    function renderTopProducts(containerId) {
        var container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        var items = getPublishedProductItems()
            .filter(function (item) {
                return item.featured === true;
            })
            .slice(0, 4);

        if (items.length === 0) {
            container.innerHTML = '<p class="products-empty">現在、表示できるプロダクトはありません。</p>';
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
        if (!container) {
            return;
        }

        var items = getPublishedProductItems();

        if (items.length === 0) {
            container.innerHTML = '<p class="products-empty">現在、表示できるプロダクトはありません。</p>';
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

    document.addEventListener("DOMContentLoaded", function () {
        renderTopProducts("top-products-list");
        renderProductsArchive("products-archive-list");
    });
})();
