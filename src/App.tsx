import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Footer, Navbar, Wrapper } from "@/components";

const META_CONFIG = {
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

export const App = () => {
  const { hash, pathname } = useLocation();
  const { i18n } = useTranslation();

  // Скроллим после двух кадров: к этому моменту секция гарантированно отрендерена
  useEffect(() => {
    if (!hash) return;

    const id = hash.replace("#", "");
    const element = document.getElementById(id);
    if (!element) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: "smooth" });
      });
    });
  }, [hash]);

  // Метаданные нужны только главной — остальные страницы управляют title сами
  useEffect(() => {
    if (pathname !== "/") return;

    const currentLng = i18n.language.startsWith("ru") ? "ru" : "en";
    const locale = META_CONFIG[currentLng];

    document.title = locale.title;
    document.documentElement.setAttribute("lang", currentLng);

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", locale.description);
    }
  }, [i18n.language, pathname]);

  return (
    <Wrapper>
      <Navbar />
      <Outlet />
      <Footer />
    </Wrapper>
  );
};
