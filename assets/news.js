(function () {
    "use strict";

    function getPublishedNewsItems() {
        if (!Array.isArray(NEWS_ITEMS)) {
            return [];
        }

        return NEWS_ITEMS
            .filter(function (item) {
                return item && item.published === true;
            })
            .sort(function (a, b) {
                return new Date(b.date) - new Date(a.date);
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

    function formatDate(dateString) {
        if (!dateString) {
            return "";
        }

        return dateString.replace(/-/g, ".");
    }

    function renderTopNews(containerId, limit) {
        var container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        var items = getPublishedNewsItems().slice(0, limit);
        if (items.length === 0) {
            container.innerHTML = '<p class="news-empty">現在、お知らせはありません。</p>';
            return;
        }

        var html = items.map(function (item) {
            return (
                '<article class="news-item">' +
                    '<a class="news-item__link" href="' + escapeHtml(item.url) + '">' +
                        '<p class="news-item__date">' + escapeHtml(formatDate(item.date)) + '</p>' +
                        '<h3 class="news-item__title">' + escapeHtml(item.title) + '</h3>' +
                        '<p class="news-item__summary">' + escapeHtml(item.summary) + '</p>' +
                    '</a>' +
                '</article>'
            );
        }).join("");

        container.innerHTML = html;
    }

    function renderNewsArchive(containerId) {
        var container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        var items = getPublishedNewsItems();
        if (items.length === 0) {
            container.innerHTML = '<p class="news-empty">現在、お知らせはありません。</p>';
            return;
        }

        var html = items.map(function (item) {
            return (
                '<article class="news-item" id="' + escapeHtml(item.id) + '">' +
                    '<a class="news-item__link" href="' + escapeHtml(item.url) + '">' +
                        '<p class="news-item__date">' + escapeHtml(formatDate(item.date)) + '</p>' +
                        '<h2 class="news-item__title">' + escapeHtml(item.title) + '</h2>' +
                        '<p class="news-item__summary">' + escapeHtml(item.summary) + '</p>' +
                    '</a>' +
                '</article>'
            );
        }).join("");

        container.innerHTML = html;
    }

    document.addEventListener("DOMContentLoaded", function () {
        renderTopNews("top-news-list", 3);
        renderNewsArchive("news-archive-list");
    });
})();
