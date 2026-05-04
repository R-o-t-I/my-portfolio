import React, { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import styles from "./Navbar.module.scss";

import { NavbarItem } from "./NavbarItem/NavbarItem";
import { Button } from "@/components/Blocks";

import { IconCode } from "@/assets/icons";

const nav_list = [
  {
    title: "Обо мне",
    to: "/#about",
  },
  {
    title: "Услуги",
    to: "/#services",
  },
  {
    title: "Проекты",
    to: "/#projects",
  },
  {
    title: "Навыки",
    to: "/#skills",
  },
  {
    title: "Отзывы",
    to: "/#reviews",
  },
  {
    title: "Контакты",
    to: "/#contacts",
  },
];

export const Navbar = ({}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
  }, []);

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
      <div>
        <Button mode="primary" onClick={handleContactClick}>
          Связаться со мной
        </Button>
      </div>
    </nav>
  );
};
