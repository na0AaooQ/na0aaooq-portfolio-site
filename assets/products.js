(function (root) {
    "use strict";

    function getPageLanguage() {
        return typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "ja";
    }

    function getProductLabels() {
        var pageLanguage = getPageLanguage();

        if (pageLanguage === "en") {
            return {
                emptyMessage: "There are currently no products to display.",
                detailLabel: "Learn more",
                videoLabel: "Watch service video",
                externalLabel: "View public page",
                themesLabel: "Themes",
                allThemesStatus: "Showing all themes.",
                defaultImageAltSuffix: " image",
                getImageZoomLabel: function (imageAlt) {
                    return "View larger image: " + imageAlt;
                },
                getFilteredStatus: function (themeLabel) {
                    return "Filtered by \u201c" + themeLabel + "\u201d.";
                }
            };
        }

        return {
            emptyMessage: "現在、表示できるプロダクトはありません。",
            detailLabel: "詳しく見る",
            videoLabel: "サービス紹介動画を見る",
            externalLabel: "公開ページを見る",
            themesLabel: "対応テーマ",
            allThemesStatus: "すべてのテーマを表示しています。",
            defaultImageAltSuffix: "のイメージ画像",
            getImageZoomLabel: function (imageAlt) {
                return imageAlt + "を拡大表示";
            },
            getFilteredStatus: function (themeLabel) {
                return "「" + themeLabel + "」で絞り込みました。";
            }
        };
    }

    function getKnownThemeIds(productThemes) {
        var knownThemeIds = {};

        if (!Array.isArray(productThemes)) {
            return knownThemeIds;
        }

        productThemes.forEach(function (theme) {
            if (
                theme &&
                typeof theme.id === "string" &&
                theme.id.trim() !== "" &&
                !knownThemeIds[theme.id]
            ) {
                knownThemeIds[theme.id] = true;
            }
        });

        return knownThemeIds;
    }

    function getProductThemeConfiguration(productThemes, pageLanguage) {
        var knownThemeIds = {};
        var knownSortOrders = {};
        var themes = [];
        var hasStructuralProblem = false;

        if (!Array.isArray(productThemes)) {
            return null;
        }

        productThemes.forEach(function (theme) {
            var label;

            if (!theme || typeof theme.id !== "string" || theme.id.trim() === "") {
                hasStructuralProblem = true;
                return;
            }

            if (!theme.labels || typeof theme.labels !== "object") {
                hasStructuralProblem = true;
                return;
            }

            label = theme.labels[pageLanguage];

            if (typeof label !== "string" || label.trim() === "") {
                return;
            }

            if (
                typeof theme.sortOrder !== "number" ||
                knownThemeIds[theme.id] ||
                knownSortOrders[theme.sortOrder]
            ) {
                hasStructuralProblem = true;
                return;
            }

            knownThemeIds[theme.id] = true;
            knownSortOrders[theme.sortOrder] = true;
            themes.push({
                id: theme.id,
                label: label,
                sortOrder: theme.sortOrder
            });
        });

        if (hasStructuralProblem || themes.length === 0) {
            return null;
        }

        themes.sort(function (a, b) {
            return a.sortOrder - b.sortOrder;
        });

        return themes;
    }

    function getNormalizedThemeIds(itemThemes, knownThemeIds) {
        var normalizedThemeIds = [];
        var seenThemeIds = {};

        if (!Array.isArray(itemThemes)) {
            return normalizedThemeIds;
        }

        itemThemes.forEach(function (themeId) {
            if (
                typeof themeId === "string" &&
                knownThemeIds[themeId] &&
                !seenThemeIds[themeId]
            ) {
                seenThemeIds[themeId] = true;
                normalizedThemeIds.push(themeId);
            }
        });

        return normalizedThemeIds;
    }

    function getSortOrder(item) {
        return item && typeof item.sortOrder === "number" ? item.sortOrder : 0;
    }

    function getFilteredProductItems(items, selectedThemeId, productThemes) {
        var knownThemeIds = getKnownThemeIds(productThemes);
        var activeThemeId =
            typeof selectedThemeId === "string" && knownThemeIds[selectedThemeId]
                ? selectedThemeId
                : "";

        if (!Array.isArray(items)) {
            return [];
        }

        return items
            .filter(function (item) {
                if (!item || item.published !== true) {
                    return false;
                }

                if (!activeThemeId) {
                    return true;
                }

                return getNormalizedThemeIds(item.themes, knownThemeIds).includes(activeThemeId);
            })
            .slice()
            .sort(function (a, b) {
                return getSortOrder(a) - getSortOrder(b);
            });
    }

    function getPublishedProductItems() {
        return getFilteredProductItems(root.PRODUCT_ITEMS, "", root.PRODUCT_THEMES);
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
        html += '<a href="' + escapeHtml(href) + '"';

        if (openInNewTab) {
            html += ' target="_blank" rel="noopener noreferrer"';
        }

        html += ">" + escapeHtml(label) + "</a>";
        html += "</p>";

        return html;
    }

    function renderProductThemes(item, themeConfiguration) {
        var labels = getProductLabels();
        var themeLabels = {};
        var knownThemeIds = {};
        var itemThemes;
        var html = "";

        if (!Array.isArray(themeConfiguration)) {
            return html;
        }

        themeConfiguration.forEach(function (theme) {
            themeLabels[theme.id] = theme.label;
            knownThemeIds[theme.id] = true;
        });
        itemThemes = getNormalizedThemeIds(item.themes, knownThemeIds);

        itemThemes = itemThemes.filter(function (themeId) {
            return typeof themeLabels[themeId] === "string" && themeLabels[themeId].trim() !== "";
        });

        if (itemThemes.length === 0) {
            return html;
        }

        html += '<section class="product-card__themes">';
        html += "<h3>" + escapeHtml(labels.themesLabel) + "</h3>";
        html += '<ul class="product-theme-tags">';
        html += itemThemes
            .map(function (themeId) {
                return '<li class="product-theme-tag">' + escapeHtml(themeLabels[themeId]) + "</li>";
            })
            .join("");
        html += "</ul>";
        html += "</section>";

        return html;
    }

    function renderProductCard(item, options) {
        var headingTag = options && options.headingTag ? options.headingTag : "h3";
        var showExternalLink = options && options.showExternalLink === true;
        var showThemes = options && options.showThemes === true;
        var themeConfiguration = options && options.themeConfiguration;
        var labels = getProductLabels();
        var defaultImageAlt = item.name + labels.defaultImageAltSuffix;
        var html = "";

        html += '<article class="card product-card" id="' + escapeHtml(item.id) + '">';

        if (item.imageSrc) {
            var imageAlt = item.imageAlt || defaultImageAlt;
            var imageZoomLabel = labels.getImageZoomLabel(imageAlt);

            html += '<div class="product-card__image">';
            html += '<button type="button" class="product-card__image-button" aria-label="' + escapeHtml(imageZoomLabel) + '">';
            html += '<img src="' + escapeHtml(item.imageSrc) + '" alt="' + escapeHtml(imageAlt) + '" loading="lazy">';
            html += "</button>";
            html += "</div>";
        }

        html += "<" + headingTag + ">";
        html += "[" + escapeHtml(item.status) + "] " + escapeHtml(item.name) + "｜" + escapeHtml(item.catch);
        html += "</" + headingTag + ">";
        html += "<p>" + escapeHtml(item.description) + "</p>";

        if (showThemes) {
            html += renderProductThemes(item, themeConfiguration);
        }

        if (item.detailUrl) {
            html += renderLink(item.detailUrl, labels.detailLabel, item.detailTargetBlank === true);
        }

        if (item.infoUrl && item.infoLabel) {
            html += renderLink(item.infoUrl, item.infoLabel, item.infoTargetBlank === true);
        }

        if (item.videoUrl) {
            html += renderLink(item.videoUrl, item.videoLabel || labels.videoLabel, item.videoTargetBlank !== false);
        }

        if (showExternalLink && item.externalUrl) {
            html += renderLink(item.externalUrl, labels.externalLabel, true);
        }

        html += "</article>";

        return html;
    }

    function renderProductItems(container, items, options) {
        var labels = getProductLabels();

        if (items.length === 0) {
            container.innerHTML = '<p class="products-empty">' + escapeHtml(labels.emptyMessage) + "</p>";
            return;
        }

        container.innerHTML = items
            .map(function (item) {
                return renderProductCard(item, options);
            })
            .join("");
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

        renderProductItems(container, items, {
            headingTag: "h3",
            showExternalLink: true,
            showThemes: false
        });
    }

    function populateThemeOptions(select, themeConfiguration) {
        var allThemesOption = select.querySelector('option[value=""]');

        if (!allThemesOption) {
            allThemesOption = document.createElement("option");
            allThemesOption.value = "";
            select.appendChild(allThemesOption);
        }

        while (select.options.length > 1) {
            select.remove(1);
        }

        themeConfiguration.forEach(function (theme) {
            var option = document.createElement("option");
            option.value = theme.id;
            option.textContent = theme.label;
            select.appendChild(option);
        });
    }

    function initializeProductsArchive() {
        var container = document.getElementById("products-archive-list");
        var filter = document.getElementById("products-theme-filter");
        var select = document.getElementById("products-theme-select");
        var status = document.getElementById("products-theme-status");
        var emptyState = document.getElementById("products-theme-empty");
        var resetButton = document.getElementById("products-theme-reset");
        var items = getPublishedProductItems();
        var themeConfiguration = getProductThemeConfiguration(root.PRODUCT_THEMES, getPageLanguage());
        var labels = getProductLabels();

        if (!container) {
            return;
        }

        function updateProducts(selectedThemeId, shouldAnnounce) {
            var activeThemeId =
                typeof selectedThemeId === "string" &&
                themeConfiguration.some(function (theme) {
                    return theme.id === selectedThemeId;
                })
                    ? selectedThemeId
                    : "";
            var filteredItems = getFilteredProductItems(
                root.PRODUCT_ITEMS,
                activeThemeId,
                root.PRODUCT_THEMES
            );

            if (select.value !== activeThemeId) {
                select.value = activeThemeId;
            }

            if (activeThemeId && filteredItems.length === 0) {
                container.innerHTML = "";
                emptyState.hidden = false;
            } else {
                emptyState.hidden = true;
                renderProductItems(container, filteredItems, {
                    headingTag: "h2",
                    showExternalLink: true,
                    showThemes: true,
                    themeConfiguration: themeConfiguration
                });
            }

            if (shouldAnnounce) {
                status.textContent = activeThemeId
                    ? labels.getFilteredStatus(
                        themeConfiguration.filter(function (theme) {
                            return theme.id === activeThemeId;
                        })[0].label
                    )
                    : labels.allThemesStatus;
            }
        }

        if (!themeConfiguration || !filter || !select || !status || !emptyState || !resetButton) {
            renderProductItems(container, items, {
                headingTag: "h2",
                showExternalLink: true,
                showThemes: false
            });
            return;
        }

        populateThemeOptions(select, themeConfiguration);
        filter.hidden = false;

        select.addEventListener("change", function () {
            updateProducts(select.value, true);
        });

        resetButton.addEventListener("click", function () {
            updateProducts("", true);
            select.focus();
        });

        updateProducts("", false);
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

    root.PRODUCT_FILTER = {
        getFilteredProductItems: getFilteredProductItems
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = root.PRODUCT_FILTER;
    }

    if (typeof document !== "undefined") {
        document.addEventListener("DOMContentLoaded", function () {
            renderTopProducts("top-products-list");
            initializeProductsArchive();
            initializeProductImageModal();
        });
    }
})(typeof window !== "undefined" ? window : globalThis);
