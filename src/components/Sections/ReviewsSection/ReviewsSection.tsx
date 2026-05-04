import React from "react";

import { useTranslation } from "react-i18next";

import styles from "./ReviewsSection.module.scss";

import { Section } from "@/components";

interface ReviewsSectionProps {
  id?: string;
}

export const ReviewsSection = ({ id }: ReviewsSectionProps) => {
  const { t } = useTranslation();

  return (
    <Section
      id={id}
      title={t("section.reviews.title")}
      subtitle={t("section.reviews.subtitle")}
      className={styles.wrapper}
    >
      ReviewsSection
    </Section>
  );
};
