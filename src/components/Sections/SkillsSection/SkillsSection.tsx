import React from "react";

import styles from "./SkillsSection.module.scss";

import { Section } from "@/components";

interface SkillsSectionProps {
  id?: string;
}

export const SkillsSection = ({ id }: SkillsSectionProps) => {
  return (
    <Section
      id={id}
      title="Навыки"
      subtitle="Мои навыки"
      className={styles.wrapper}
    >
      SkillsSection
    </Section>
  );
};
