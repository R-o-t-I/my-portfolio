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
    lastScrollY.current = 0;

    // Сбрасываем смещение кнопки "Назад" в дефолтное положение
    document.documentElement.style.setProperty("--navbar-offset-y", "0px");
    window.scrollTo(0, 0); // Скроллим страницу наверх при переходе
  }, [location.pathname]);

  // 3. ИСПРАВЛЕНО: ЧИСТОЕ НАТИВНОЕ УПРАВЛЕНИЕ СКРОЛЛОМ БЕЗ КОНФЛИКТОВ ТАЧ-СОБЫТИЙ
  useEffect(() => {
    if (menuActive) return;

    const handleScroll = () => {
      // Кроссбраузерное получение позиции вертикального скролла страницы
      const currentScrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;

      // ЗАЩИТА ОТ iOS BOUNCE: Игнорируем отрицательный скролл при отскоке вверх страницы
      if (currentScrollY < 0) {
        setIsVisible(true);
        document.documentElement.style.setProperty("--navbar-offset-y", "0px");
        return;
      }

      // ЗАЩИТА ОТ iOS BOUNCE: Предотвращаем баги дерганья навигации при отскоке от футера сайта
      const maxScrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (currentScrollY >= maxScrollableHeight - 10) {
        return;
      }

      // Меняем прозрачность/тень навбара при легком отрыве от верха
      setIsScrolled(currentScrollY > 20);

      // ИСПРАВЛЕНО: Навбар начинает скрываться, только если пользователь пролистал базовую высоту (80px)
      if (currentScrollY <= 80) {
        setIsVisible(true);
        document.documentElement.style.setProperty("--navbar-offset-y", "0px");
      } else {
        // Вычисляем разницу между предыдущим и текущим шагом скролла
        const diff = currentScrollY - lastScrollY.current;

        // Порог в 5px защищает от микро-дрожания пальца на экране телефона
        if (Math.abs(diff) > 5) {
          if (diff > 0) {
            // СКРОЛЛ ВНИЗ: Навбар уезжает плавно
            setIsVisible(false);
            // Передаем точное смещение в CSS (учитываем высоту плашки навбара — 80px)
            document.documentElement.style.setProperty(
              "--navbar-offset-y",
              "-80px",
            );
          } else {
            // СКРОЛЛ ВВЕРХ: Навбар возвращается плавно
            setIsVisible(true);
            document.documentElement.style.setProperty(
              "--navbar-offset-y",
              "0px",
            );
          }
        }
      }

      // Запоминаем текущую координату для следующего такта прокрутки
      lastScrollY.current = currentScrollY;
    };

    // Слушаем исключительно системное нативное событие scroll окна (оно идеально обрабатывает инерцию)
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
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
        rootMargin: "-80px 0px 0px 0px", // Заменили реф на стабильные 80px
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
