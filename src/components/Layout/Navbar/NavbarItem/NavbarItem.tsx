import React from "react";

import { Link, useLocation } from "react-router-dom";

import styles from "./NavbarItem.module.scss";

import { Text } from "@/components/Typography";

interface NavbarItemProps {
  children: React.ReactNode;
  to?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const NavbarItem = ({
  children,
  to = "/",
  isActive,
  onClick,
}: NavbarItemProps) => {
  const location = useLocation();

  const targetId = to.includes("#") ? to.split("#")[1] : null;
  const isAnchor = Boolean(targetId);

  // Якорные ссылки валидны только на главной; с других страниц
  // сначала переходим на главную, на которой якорь сработает
  const href = isAnchor && location.pathname !== "/" ? `/#${targetId}` : to;

  const handleClick = (e: React.MouseEvent) => {
    if (!isAnchor) return; // обычный переход — Link справится сам

    if (location.pathname === "/") {
      e.preventDefault();

      // Сужаем тип: targetId гарантированно строка после isAnchor
      if (!targetId) return;

      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", to);
      }
    }
  };

  return (
    <Link
      to={href}
      onClick={(e) => {
        handleClick(e);
        onClick?.();
      }}
      className={`${styles.wrapper} ${isActive ? styles.active : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <Text size="sm" mode="secondary" align="center" className={styles.navbar}>
        {children}
      </Text>
    </Link>
  );
};
