import React from "react";

import { useTranslation } from "react-i18next";

import styles from "./Loading.module.scss";

import { Section, Text } from "@/components";

export const Loading = () => {
  const { t } = useTranslation();

  return (
    <Section className={styles.wrapper}>
      <div className={styles.loadingContainer}>
        <div
          className={styles.spinner}
          aria-label={t("loading", "Загрузка...")}
        >
          <div className={styles.spinnerInner}></div>
        </div>
        <Text>{t("loading", "Загрузка...")}</Text>
      </div>
    </Section>
  );
};
