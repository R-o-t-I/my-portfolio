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
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

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

  // 3. ИСПРАВЛЕНО: УНИВЕРСАЛЬНЫЙ КОМБИНИРОВАННЫЙ СКРОЛЛ-ХУК ДЛЯ МОБИЛЬНЫХ И ДЕВТУЛСА
  useEffect(() => {
    // ИСПРАВЛЕНО: Задаем высоту жестко через CSS-переменную на старте, чтобы отступ не прыгал фантомно
    document.documentElement.style.setProperty("--navbar-height", "80px");

    if (menuActive) return;

    // Единая функция скрытия / показа навбара
    const handleScrollDirection = (
      direction: "up" | "down",
      currentScrollY: number,
    ) => {
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY <= 80 || direction === "up") {
        setIsVisible(true);
        document.documentElement.style.setProperty("--navbar-offset-y", "0px");
      } else if (direction === "down" && currentScrollY > 80) {
        setIsVisible(false);
        document.documentElement.style.setProperty(
          "--navbar-offset-y",
          "-80px",
        ); // Фиксированное смещение
      }
    };

    // А. ОБРАБОТКА ДЛЯ ДЕСКТОПА / МЫШКИ / ТАЧПАДА
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // Игнорируем скролл карусели
      const currentScrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;
      handleScrollDirection(e.deltaY > 0 ? "down" : "up", currentScrollY);
    };

    // Б. ОБРАБОТКА ДЛЯ МОБИЛЬНЫХ ТАЧЕЙ (Защита от блокировок скролла окна)
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;

      const diffY = touchStartY.current - currentY;
      const diffX = touchStartX.current - currentX;

      // Полностью игнорируем горизонтальные свайпы галереи
      if (Math.abs(diffX) > Math.abs(diffY)) return;

      const currentScrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;

      // Порог в 8px для отсечения микротремора рук
      if (Math.abs(diffY) > 8) {
        handleScrollDirection(diffY > 0 ? "down" : "up", currentScrollY);
        touchStartY.current = currentY; // Плавное скольжение
      }
    };

    // В. СТРАХОВКА: Нативный скролл ловит инерцию (когда палец оторван от экрана)
    const handleNativeScroll = (e: Event) => {
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

      if (currentScrollY < 0) return; // Защита от bounce верхнего края

      const diff = currentScrollY - lastScrollY.current;
      if (Math.abs(diff) > 10) {
        handleScrollDirection(diff > 0 ? "down" : "up", currentScrollY);
      }
      lastScrollY.current = currentScrollY;
    };

    // Вешаем слушатели на все возможные типы ввода
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("scroll", handleNativeScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("scroll", handleNativeScroll, {
        capture: true,
      });
    };
  }, [menuActive]);

  // 4. ОБРАБОТКА ХЕША
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

  // 5. ОБНОВЛЕНИЕ АКТИВНОЙ СЕКЦИИ ПРИ СКРОЛЛЕ
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
        rootMargin: "-80px 0px 0px 0px", // Жесткие 80px вместо рефа
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
          <div className={styles.burger_menu}>
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
