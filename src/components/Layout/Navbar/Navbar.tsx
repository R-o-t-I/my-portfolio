import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavbarItems } from "@/hooks";

import styles from "./Navbar.module.scss";

import { NavbarItem } from "./NavbarItem/NavbarItem";
import { Button, Dropdown, Text } from "@/components";

import {
  IconCode,
  IconLangEN,
  IconLangRU,
  IconMoon,
  IconSettings,
  IconSun,
} from "@/assets/icons";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [menuActive, setMenuActive] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const navigate = useNavigate();
  const location = useLocation();
  const navItems = useNavbarItems();
  const { t, i18n } = useTranslation();

  const [currentTheme, setCurrentTheme] = useState(
    () => localStorage.getItem("theme") || "system",
  );

  const scheme = useMemo(
    () => [
      {
        value: "light",
        label: t("nav.theme.light"),
        icon: <IconSun size={20} />,
      },
      {
        value: "dark",
        label: t("nav.theme.dark"),
        icon: <IconMoon size={20} />,
      },
      {
        value: "system",
        label: t("nav.theme.system"),
        icon: <IconSettings size={20} />,
      },
    ],
    [t],
  );

  const activeTheme = scheme.find((s) => s.value === currentTheme) || scheme[0];

  const languages = useMemo(
    () => [
      {
        code: "ru",
        flag: <IconLangRU size={20} />,
        label: "Русский",
        onClick: () => i18n.changeLanguage("ru"),
      },
      {
        code: "en",
        flag: <IconLangEN size={20} />,
        label: "English",
        onClick: () => i18n.changeLanguage("en"),
      },
    ],
    [i18n],
  );

  const currentLanguage =
    languages.find((l) => l.code === i18n.language) || languages[0];

  // 1. СИНХРОНИЗАЦИЯ ТЕМЫ ОФОРМЛЕНИЯ И LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem("theme", currentTheme);
    if (currentTheme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", currentTheme);
    }
  }, [currentTheme]);

  // 2. СБРОС СОСТОЯНИЯ НАВБАРА ПРИ ПЕРЕХОДЕ НА НОВУЮ СТРАНИЦУ
  useEffect(() => {
    setIsVisible(true);
    setIsScrolled(false);
    setMenuActive(false);
    lastScrollY.current = 0;

    document.documentElement.style.setProperty("--navbar-offset-y", "0px");
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 3. ИСПРАВЛЕНО: ГАРАНТИРОВАННОЕ ОТСЛЕЖИВАНИЕ СКРОЛЛА ДЛЯ ЛЮБЫХ CSS СТРУКТУР И ДЕВТУЛСА
  useEffect(() => {
    const updateHeight = () => {
      if (navRef.current) {
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${navRef.current.offsetHeight}px`,
        );
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    if (menuActive) return;

    const handleScroll = (e: Event) => {
      const navbarHeight = navRef.current?.offsetHeight || 80;

      // Вычисляем позицию прокрутки из любого доступного источника (чинит DevTools и мобильные)
      const target = e.target as HTMLElement | Document;
      const scrollNode =
        target instanceof Document ?
          target.documentElement || target.body
        : target;

      const currentScrollY =
        window.scrollY ||
        (scrollNode ? scrollNode.scrollTop : 0) ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;

      // Защита от iOS отскоков (bounce) вверх
      if (currentScrollY < 0) {
        setIsVisible(true);
        document.documentElement.style.setProperty("--navbar-offset-y", "0px");
        return;
      }

      // Защита от iOS отскоков (bounce) вниз футера
      const maxScrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (currentScrollY >= maxScrollableHeight - 10) return;

      setIsScrolled(currentScrollY > 20);

      if (currentScrollY <= navbarHeight) {
        setIsVisible(true);
        document.documentElement.style.setProperty("--navbar-offset-y", "0px");
      } else {
        const diff = currentScrollY - lastScrollY.current;

        // Порог в 6 пикселей для фильтрации микротремора пальца
        if (Math.abs(diff) > 6) {
          if (diff > 0) {
            // СКРОЛЛ ВНИЗ
            setIsVisible(false);
            document.documentElement.style.setProperty(
              "--navbar-offset-y",
              `-${navbarHeight}px`,
            );
          } else {
            // СКРОЛЛ ВВЕРХ
            setIsVisible(true);
            document.documentElement.style.setProperty(
              "--navbar-offset-y",
              "0px",
            );
          }
        }
      }

      lastScrollY.current = currentScrollY;
    };

    // ИСПРАВЛЕНО ДЛЯ МОБИЛЬНЫХ: Слушаем скролл на уровне document в фазе захвата (capture: true).
    // Это заставляет скрипт перехватывать нативный скролл инерции, даже если на html/body стоит height: 100%
    document.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("resize", updateHeight);
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [menuActive]);

  // 4. ОБРАБОТКА ХЕША (Для переходов из других страниц)
  useEffect(() => {
    if (location.hash && location.pathname === "/") {
      const id = location.hash.replace("#", "");
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

  // 5. ОБНОВЛЕНИЕ АКТИВНОЙ СЕКЦИИ ПРИ СКРОЛЛЕ (IntersectionObserver)
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

  const RenderControls = () => (
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
                <div className={styles.icon}>{item.icon}</div>
                <Text>{item.label}</Text>
              </div>
            ))}
          </>
        )}
      >
        <div className={styles.dropdown}>
          <div className={styles.title}>
            <span className={styles.icon}>{activeTheme.icon}</span>
            <Text className={styles.text}>{activeTheme.label}</Text>
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
                <div className={styles.icon}>{item.flag}</div>
                <Text>{item.label}</Text>
              </div>
            ))}
          </>
        )}
      >
        <div className={styles.dropdown}>
          <div className={styles.title}>
            <span className={styles.icon}>{currentLanguage.flag}</span>
            <Text className={styles.text}>{currentLanguage.label}</Text>
          </div>
        </div>
      </Dropdown>
    </div>
  );

  return (
    <React.Fragment>
      <nav
        ref={navRef}
        className={`
          ${styles.navbar} 
          ${isScrolled ? styles.scrolled : ""} 
          ${!isVisible ? styles.hidden : ""}
        `}
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
          <RenderControls />
          <div className={styles.button_contact}>
            <Button mode="primary" onClick={() => navigate("/#contacts")}>
              {t("button.contact")}
            </Button>
          </div>
          <div className={styles.burger_menu_box}>
            <div
              className={`${styles.burger_menu} ${menuActive ? styles.active : ""}`}
              onClick={() => setMenuActive(!menuActive)}
            >
              <span />
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`${styles.menu_wrapper} ${menuActive ? styles.active : ""}`}
      >
        <div className={styles.nav_list}>
          {navItems.map((item, index) => (
            <NavbarItem
              key={index}
              to={item.to}
              isActive={activeSection === item.id}
              onClick={() => setMenuActive(false)}
            >
              {item.title}
            </NavbarItem>
          ))}
        </div>
        <RenderControls />
        <div className={styles.button_contact}>
          <Button
            mode="primary"
            stretched
            onClick={() => {
              navigate("/#contacts");
              setMenuActive(false);
            }}
          >
            {t("button.contact")}
          </Button>
        </div>
      </div>
    </React.Fragment>
  );
};
