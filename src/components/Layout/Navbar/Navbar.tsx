import React, { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./Navbar.module.scss";

import { NavbarItem } from "./NavbarItem/NavbarItem";
import { Button, Dropdown, Text } from "@/components";

import { IconCode } from "@/assets/icons";

export const Navbar = ({}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("theme") || "system",
  );

  const scheme = [
    { value: "light", label: t("nav.theme.light"), icon: "☀️" },
    { value: "dark", label: t("nav.theme.dark"), icon: "🌑" },
    { value: "system", label: t("nav.theme.system"), icon: "⚙️" },
  ];

  // Находим объект текущей темы для отображения в кнопке
  const activeTheme = scheme.find((s) => s.value === currentTheme) || scheme[0];

  const nav_list = [
    {
      title: t("nav.about"),
      to: "/#about",
    },
    {
      title: t("nav.services"),
      to: "/#services",
    },
    {
      title: t("nav.projects"),
      to: "/#projects",
    },
    {
      title: t("nav.skills"),
      to: "/#skills",
    },
    {
      title: t("nav.reviews"),
      to: "/#reviews",
    },
    {
      title: t("nav.contacts"),
      to: "/#contacts",
    },
  ];

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

  useEffect(() => {
    if (currentTheme === "system") {
      // Удаляем атрибут, чтобы сработал медиа-запрос (prefers-color-scheme)
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      // Устанавливаем атрибут light или dark
      document.documentElement.setAttribute("data-theme", currentTheme);
      localStorage.setItem("theme", currentTheme);
    }

    const updateHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        // Записываем реальную высоту в глобальную CSS-переменную
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${height}px`,
        );
      }
    };

    // Замеряем при монтировании
    updateHeight();

    // Следим за ресайзом окна
    window.addEventListener("resize", updateHeight);

    // Если высота меняется плавно (transition), можно замерить еще раз через задержку
    const scrollHandler = () => {
      setIsScrolled(window.scrollY > 48);
      updateHeight(); // Перезамеряем, так как паддинги в .scrolled могут менять высоту
    };

    window.addEventListener("scroll", scrollHandler);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("scroll", scrollHandler);
    };
  }, [currentTheme]);

  const handleContactClick = () => {
    if (location.pathname === "/") {
      const element = document.getElementById("contacts");
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#contacts");
    }
  };

  return (
    <nav
      ref={navRef}
      className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}
    >
      <div className={styles.before}>
        <div className={styles.logo_wrapper}>
          <IconCode />
        </div>
        <div className={styles.nav_list}>
          {nav_list.map((item, index) => (
            <NavbarItem key={index} to={item.to}>
              {item.title}
            </NavbarItem>
          ))}
        </div>
      </div>
      <div className={styles.after}>
        <div className={styles.controls}>
          <Dropdown
            dropdownContent={(closeMenu) => (
              <React.Fragment>
                {scheme.map((item) => (
                  <div
                    key={item.value}
                    className={styles.dropdown_item}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTheme(item.value); // Меняем тему
                      closeMenu();
                    }}
                  >
                    <span>{item.icon}</span>
                    <Text>{item.label}</Text>
                  </div>
                ))}
              </React.Fragment>
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
              <React.Fragment>
                {languages.map((item, index) => (
                  <React.Fragment key={index}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                        closeMenu(); // Явно закрываем меню после действия
                      }}
                      className={styles.dropdown_item}
                    >
                      <span>{item.flag}</span>
                      <Text>{item.label}</Text>
                    </div>
                  </React.Fragment>
                ))}
              </React.Fragment>
            )}
          >
            <div className={styles.dropdown}>
              {languages.map((item, index) => (
                <React.Fragment key={index}>
                  {i18n.language === item.code && (
                    <div className={styles.title}>
                      <span>{item.flag}</span>
                      <Text>{item.label}</Text>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Dropdown>
        </div>

        <Button mode="primary" onClick={handleContactClick}>
          {t("button.contact")}
        </Button>
      </div>
    </nav>
  );
};
