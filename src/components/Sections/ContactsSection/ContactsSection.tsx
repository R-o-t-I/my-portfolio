import React from "react";

import styles from "./ContactsSection.module.scss";

import { Section } from "@/components";

interface ContactsSectionProps {
  id?: string;
}

export const ContactsSection = ({ id }: ContactsSectionProps) => {
  return (
    <Section
      id={id}
      title="Контакты"
      subtitle="Связаться со мной"
      className={styles.wrapper}
    >
      ContactsSection
    </Section>
  );
};
