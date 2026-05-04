import React from "react";

import styles from "./ReviewsSection.module.scss";

import { Section } from "@/components";

interface ReviewsSectionProps {
  id?: string;
}

export const ReviewsSection = ({ id }: ReviewsSectionProps) => {
  return (
    <Section
      id={id}
      title="Отзывы"
      subtitle="Что говорят"
      className={styles.wrapper}
    >
      ReviewsSection
    </Section>
  );
};
