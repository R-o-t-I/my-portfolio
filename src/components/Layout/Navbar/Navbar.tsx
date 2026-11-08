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
    setMenuActive(false); // Закрываем бургер при смене роута

    // Сбрасываем смещение кнопки "Назад" в дефолтное положение
    document.documentElement.style.setProperty("--navbar-offset-y", "16px");
    window.scrollTo(0, 0); // Скроллим страницу наверх при переходе
  }, [location.pathname]);

  // 3. УПРАВЛЕНИЕ ВЫСОТОЙ НАВБАРA, НАПРАВЛЕНИЕМ И ТРЕКИНГОМ СКРОЛЛА
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

    let touchStartY = 0;
    let touchStartX = 0; // Добавили для отслеживания горизонтальной оси тача

    const handleWheel = (e: WheelEvent) => {
      // ИСПРАВЛЕНО: Если горизонтальный скролл колесика/тачпада больше вертикального,
      // значит пользователь крутит галерею — полностью игнорируем это событие
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const navbarHeight = navRef.current?.offsetHeight || 80;
      const currentScrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;

      if (e.deltaY > 0 && currentScrollY > navbarHeight) {
        setIsVisible(false);
        setIsScrolled(true);
        document.documentElement.style.setProperty(
          "--navbar-offset-y",
          `-${navbarHeight}px`,
        );
      } else if (e.deltaY < 0) {
        setIsVisible(true);
        document.documentElement.style.setProperty("--navbar-offset-y", "0px");
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX; // Запоминаем стартовую точку по горизонтали
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchEndY = e.touches[0].clientY;
      const touchEndX = e.touches[0].clientX; // Конечная точка по горизонтали

      const differenceY = touchStartY - touchEndY;
      const differenceX = touchStartX - touchEndX; // Дистанция свайпа по горизонтали

      const navbarHeight = navRef.current?.offsetHeight || 80;
      const currentScrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;

      // ИСПРАВЛЕНО: Если свайп пальцем по горизонтали (X) больше, чем по вертикали (Y),
      // значит идет прокрутка карусели или свайп галереи — выходим из функции
      if (Math.abs(differenceX) > Math.abs(differenceY)) return;

      if (Math.abs(differenceY) > 10) {
        if (differenceY > 0 && currentScrollY > navbarHeight) {
          setIsVisible(false);
          setIsScrolled(true);
          document.documentElement.style.setProperty(
            "--navbar-offset-y",
            `-${navbarHeight}px`,
          );
        } else if (differenceY < 0) {
          setIsVisible(true);
          document.documentElement.style.setProperty(
            "--navbar-offset-y",
            "0px",
          );
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [menuActive, location.pathname]);

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
