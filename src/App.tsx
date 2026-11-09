import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Footer, Navbar, Wrapper } from "@/components";

export const App = () => {
  const { hash, pathname } = useLocation(); // Добавили pathname
  const { i18n } = useTranslation();

  // 1. СМУЗ-СКРОЛЛ К СЕКЦИЯМ
  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [hash]);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const metaConfig = {
      ru: {
        title: "Веб-разработчик и дизайнер – Александр Тихонович",
        description:
          "Портфолио Александра Тихоновича – современная веб-разработка и дизайн интерфейсов.",
      },
      en: {
        title: "Web Developer & Designer – Alexander Tihonovich",
        description:
          "Alexander Tihonovich – modern web development and UI/UX design portfolio.",
      },
    };

    const currentLng = i18n.language.startsWith("ru") ? "ru" : "en";
    const locale = metaConfig[currentLng];

    document.title = locale.title;
    document.documentElement.setAttribute("lang", currentLng);

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", locale.description);
    }
  }, [i18n.language, pathname]); // Добавили pathname в зависимости

  return (
    <Wrapper>
      <Navbar />
      <Outlet />
      <Footer />
    </Wrapper>
  );
};
