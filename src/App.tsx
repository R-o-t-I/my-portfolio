import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Footer, Navbar, Wrapper } from "@/components";

export const App = ({}) => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // Задержка нужна, чтобы DOM успел полностью отрисоваться
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [hash]);

  return (
    <Wrapper>
      <Navbar />
      {/* Outlet автоматически подставит Home или Project в зависимости от ссылки */}
      <Outlet />
      <Footer />
    </Wrapper>
  );
};
