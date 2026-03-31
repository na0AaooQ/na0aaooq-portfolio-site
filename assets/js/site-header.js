(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var menuToggle = document.querySelector(".menu-toggle");
        var mobileNav = document.getElementById("mobile-nav");

        if (!menuToggle || !mobileNav) {
            return;
        }

        function closeMenu() {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "メニューを開く");
            mobileNav.hidden = true;
            document.body.classList.remove("is-mobile-nav-open");
        }

        function openMenu() {
            menuToggle.setAttribute("aria-expanded", "true");
            menuToggle.setAttribute("aria-label", "メニューを閉じる");
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
