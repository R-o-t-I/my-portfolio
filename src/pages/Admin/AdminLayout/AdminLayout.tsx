import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/utils";
import { useAdminAuth } from "@/hooks";
import { useTranslation } from "react-i18next";

import styles from "./AdminLayout.module.scss";

import { Button, Dropdown, Separator, Text } from "@/components";
import { useEffect, useMemo, useState } from "react";
import {
  IconLangEN,
  IconLangRU,
  IconMoon,
  IconSettings,
  IconSun,
} from "@/assets/icons";

export const AdminLayout = () => {
  const navigate = useNavigate();
  const { isAdmin, isEditor } = useAdminAuth();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const handleClick = () => {
    navigate("/");
  };

  type NavItem = {
    to: string;
    label: string;
    // доступ: "all" — всем, "editor" — админ или редактор, "admin" — только админ
    access: "all" | "editor" | "admin";
  };

  const NAV_ITEMS: NavItem[] = [
    { to: "/admin", label: "Главная", access: "all" },
    { to: "/admin/projects", label: "Проекты", access: "editor" },
    { to: "/admin/skills", label: "Навыки", access: "editor" },
    { to: "/admin/contacts", label: "Заявки", access: "admin" },
    { to: "/admin/logs", label: "Журнал", access: "admin" },
  ];

  const NAV_ACCESS: Record<NavItem["access"], boolean> = {
    all: true,
    editor: isAdmin || isEditor,
    admin: isAdmin,
  };

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === "/admin"} // точное совпадение только для главной
      className={({ isActive }) =>
        isActive ? `${styles.link} ${styles.linkActive}` : styles.link
      }
    >
      <Text size="sm">{item.label}</Text>
    </NavLink>
  );

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
            {/* <Text className={styles.text}>{activeTheme.label}</Text> */}
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
            {/* <Text className={styles.text}>{currentLanguage.label}</Text> */}
          </div>
        </div>
      </Dropdown>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Text size="lg">Админка</Text>
        </div>
        <Separator />

        <nav className={styles.nav}>
          {NAV_ITEMS.filter((item) => NAV_ACCESS[item.access]).map(
            renderNavItem,
          )}
        </nav>

        <div className={styles.footer}>
          <Separator />
          <div className={styles.content_footer}>
            <RenderControls />
            <button
              type="button"
              className={styles.button}
              onClick={handleClick}
            >
              <Text size="sm">На главную</Text>
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={handleLogout}
            >
              <Text size="sm">Выйти</Text>
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};
