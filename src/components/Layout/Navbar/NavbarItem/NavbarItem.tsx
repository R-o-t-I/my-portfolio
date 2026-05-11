import React from "react";

import { useNavigate, useLocation } from "react-router-dom";

import styles from "./NavbarItem.module.scss";

import { Text } from "@/components/Typography";

interface NavbarItemProps {
  children: React.ReactNode;
  to?: string;
  isActive?: boolean;
}

export const NavbarItem = ({
  children,
  to = "/",
  isActive,
}: NavbarItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const targetId = to.includes("#") ? to.split("#")[1] : null;

    if (location.pathname === "/") {
      if (targetId) {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          // Принудительно обновляем URL в строке
          window.history.pushState(null, "", to);
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", "/");
      }
    } else {
      // Если уходим с другой страницы на главную к якорю
      navigate(to);
    }
  };

  return (
    <button
      type="button" // Добавляем тип, чтобы избежать случайных отправок форм
      onClick={handleClick}
      className={`${styles.wrapper} ${isActive ? styles.active : ""}`}
    >
      <Text size="sm" mode="secondary" className={styles.navbar}>
        {children}
      </Text>
    </button>
  );
};
