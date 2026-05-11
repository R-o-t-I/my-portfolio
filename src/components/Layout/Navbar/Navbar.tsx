import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavbarItems } from "@/hooks";

import styles from "./Navbar.module.scss";
import { NavbarItem } from "./NavbarItem/NavbarItem";
import { Button, Dropdown, Text } from "@/components";
import { IconCode } from "@/assets/icons";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = useNavbarItems();
  const { t, i18n } = useTranslation();

  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("theme") || "system",
  );

  const scheme = [
    { value: "light", label: t("nav.theme.light"), icon: "☀️" },
    { value: "dark", label: t("nav.theme.dark"), icon: "🌑" },
    { value: "system", label: t("nav.theme.system"), icon: "⚙️" },
  ];

  const activeTheme = scheme.find((s) => s.value === currentTheme) || scheme[0];

  const languages = [
    {
      code: "ru",
      flag: "🇷🇺",
      label: "Русский",
      onClick: () => i18n.changeLanguage("ru"),
    },
    {
      code: "en",
      flag: "🇬🇧",
      label: "English",
      onClick: () => i18n.changeLanguage("en"),
    },
  ];

  // УПРАВЛЕНИЕ ВЫСОТОЙ И ТЕМОЙ
  useEffect(() => {
    const updateHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${height}px`,
        );
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.addEventListener("scroll", () => setIsScrolled(window.scrollY > 20));

    if (currentTheme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", currentTheme);
    }

    return () => window.removeEventListener("resize", updateHeight);
  }, [currentTheme]);

  // ОБРАБОТКА ХЕША (Для переходов из других страниц)
  useEffect(() => {
    if (location.hash && location.pathname === "/") {
      const id = location.hash.replace("#", "");
      // Даем время на рендер контента из Supabase
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          setActiveSection(id);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname]);

  // ОБНОВЛЕНИЕ АКТИВНОЙ СЕКЦИИ ПРИ СКРОЛЛЕ
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.id;
            setActiveSection(id);
            // Меняем URL без прыжка скролла
            window.history.replaceState(null, "", `/#${id}`);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: `-${navRef.current?.offsetHeight || 80}px 0px 0px 0px`,
      },
    );

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname, navItems]);

  return (
    <nav
      ref={navRef}
      className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}
    >
      <div className={styles.before}>
        <div
          className={styles.logo_wrapper}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <IconCode />
        </div>
        <div className={styles.nav_list}>
          {navItems.map((item, index) => (
            <NavbarItem
              key={index}
              to={item.to}
              isActive={activeSection === item.id}
            >
              {item.title}
            </NavbarItem>
          ))}
        </div>
      </div>

      <div className={styles.after}>
        <div className={styles.controls}>
          <Dropdown
            dropdownContent={(closeMenu) => (
              <>
                {scheme.map((item) => (
                  <div
                    key={item.value}
                    className={styles.dropdown_item}
                    onClick={() => {
                      setCurrentTheme(item.value);
                      closeMenu();
                    }}
                  >
                    <span>{item.icon}</span>
                    <Text>{item.label}</Text>
                  </div>
                ))}
              </>
            )}
          >
            <div className={styles.dropdown}>
              <div className={styles.title}>
                <span>{activeTheme.icon}</span>
                <Text>{activeTheme.label}</Text>
              </div>
            </div>
          </Dropdown>

          <Dropdown
            dropdownContent={(closeMenu) => (
              <>
                {languages.map((item) => (
                  <div
                    key={item.code}
                    className={styles.dropdown_item}
                    onClick={() => {
                      item.onClick();
                      closeMenu();
                    }}
                  >
                    <span>{item.flag}</span>
                    <Text>{item.label}</Text>
                  </div>
                ))}
              </>
            )}
          >
            <div className={styles.dropdown}>
              <div className={styles.title}>
                <span>
                  {languages.find((l) => l.code === i18n.language)?.flag}
                </span>
                <Text>
                  {languages.find((l) => l.code === i18n.language)?.label}
                </Text>
              </div>
            </div>
          </Dropdown>
        </div>

        <Button mode="primary" onClick={() => navigate("/#contacts")}>
          {t("button.contact")}
        </Button>
      </div>
    </nav>
  );
};
