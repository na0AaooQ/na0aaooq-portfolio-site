(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var STORAGE_KEY = "portfolioPreferredLanguage";
        var pageLanguage = document.documentElement.lang === "en" ? "en" : "ja";
        var menuToggle = document.querySelector(".menu-toggle");
        var mobileNav = document.getElementById("mobile-nav");
        var languageLinks = document.querySelectorAll("a[lang]");

        function setPreferredLanguage(language) {
            try {
                window.localStorage.setItem(STORAGE_KEY, language);
            } catch (error) {
                /* もし、Webブラウザの localStorage が利用できない場合は何もしない */
            }
        }

        languageLinks.forEach(function (link) {
            link.addEventListener("click", function () {
                var selectedLanguage = link.getAttribute("lang");

                if (selectedLanguage === "ja" || selectedLanguage === "en") {
                    setPreferredLanguage(selectedLanguage);
                }
            });
        });

        if (!menuToggle || !mobileNav) {
            return;
        }

        function getMenuLabel(isOpen) {
            if (pageLanguage === "en") {
                return isOpen ? "Close menu" : "Open menu";
            }

            return isOpen ? "メニューを閉じる" : "メニューを開く";
        }

        function closeMenu() {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", getMenuLabel(false));
            mobileNav.hidden = true;
            document.body.classList.remove("is-mobile-nav-open");
        }

        function openMenu() {
            menuToggle.setAttribute("aria-expanded", "true");
            menuToggle.setAttribute("aria-label", getMenuLabel(true));
            mobileNav.hidden = false;
            document.body.classList.add("is-mobile-nav-open");
        }

        function toggleMenu() {
            var isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

            if (isExpanded) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        menuToggle.setAttribute("aria-label", getMenuLabel(false));

        menuToggle.addEventListener("click", function () {
            toggleMenu();
        });

        mobileNav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                closeMenu();
            });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        });
    });
})();
