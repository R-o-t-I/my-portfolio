import React from "react";

import { useTranslation } from "react-i18next";

import styles from "./ContactsSection.module.scss";

import { Section } from "@/components";

interface ContactsSectionProps {
  id?: string;
}

export const ContactsSection = ({ id }: ContactsSectionProps) => {
  const { t } = useTranslation();

  return (
    <Section
      id={id}
      title={t("section.contacts.title")}
      subtitle={t("section.contacts.subtitle")}
      className={styles.wrapper}
    >
      ContactsSection
    </Section>
  );
};
