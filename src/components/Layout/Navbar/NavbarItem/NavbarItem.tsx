import React from "react";

import { useNavigate, useLocation } from "react-router-dom";

import styles from "./NavbarItem.module.scss";

import { Text } from "@/components/Typography";

interface NavbarItemProps {
  children: React.ReactNode;
  to?: string;
}

export const NavbarItem = ({ children, to = "/" }: NavbarItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Извлекаем ID секции (например, из "/#services" получаем "services")
    const targetId = to.includes("#") ? to.split("#")[1] : null;

    if (location.pathname === "/") {
      // Если мы на главной
      if (targetId) {
        const element = document.getElementById(targetId);
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Если мы на другой странице (например, в проекте)
      navigate(to);
    }
  };

  return (
    <button onClick={handleClick} className={styles.wrapper}>
      <Text size="sm" className={styles.navbar}>
        {children}
      </Text>
    </button>
  );
};
