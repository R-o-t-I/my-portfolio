import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./NotFound.module.scss";

import { Section, Title, Text, Button } from "@/components";

import okak from "../../../assets/image/okak.png";

// Варианты страницы: обычный 404, несуществующий проект и ошибка загрузки
type NotFoundVariant = "page" | "project" | "error";

interface NotFoundLocationState {
  variant?: NotFoundVariant;
}

const VARIANT_KEYS: Record<
  Exclude<NotFoundVariant, "page">,
  { title: string; text: string }
> = {
  project: {
    title: "not_found.project.title",
    text: "not_found.project.text",
  },
  error: {
    title: "not_found.error.title",
    text: "not_found.error.text",
  },
};

export const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const variant =
    (location.state as NotFoundLocationState | null)?.variant ?? "page";

  const handleClick = () => {
    navigate("/");
  };

  return (
    <Section className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.info}>
          <span className={styles.bg_text}>404</span>
          <div className={styles.middle}>
            <Title size="lg">
              {variant === "page" ?
                t("not_found.page.title", "Страница не найдена")
              : t(VARIANT_KEYS[variant].title)}
            </Title>
            <Text>
              {variant === "page" ?
                t(
                  "not_found.page.text",
                  "Такой страницы нет, проверьте корректность ссылки",
                )
              : t(VARIANT_KEYS[variant].text)}
            </Text>
          </div>
          <div className={styles.button_wrapper}>
            <Button onClick={handleClick}>
              {t("not_found.button", "На главную")}
            </Button>
          </div>
        </div>
        <div className={styles.image_wrapper}>
          <img
            className={styles.image}
            src={okak}
            alt={t("not_found.page.alt", "Страница не найдена")}
          />
        </div>
      </div>
    </Section>
  );
};
