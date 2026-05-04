import React from "react";

import { useTranslation } from "react-i18next";

import styles from "./SkillsSection.module.scss";

import { Section } from "@/components";

interface SkillsSectionProps {
  id?: string;
}

export const SkillsSection = ({ id }: SkillsSectionProps) => {
  const { t } = useTranslation();

  return (
    <Section
      id={id}
      title={t("section.skills.title")}
      subtitle={t("section.skills.subtitle")}
      className={styles.wrapper}
    >
      SkillsSection
    </Section>
  );
};
