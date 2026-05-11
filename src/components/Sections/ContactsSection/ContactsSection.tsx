import React from "react";

import { useTranslation } from "react-i18next";

import styles from "./ContactsSection.module.scss";

import {
  Button,
  ButtonGroup,
  FormItem,
  Input,
  Section,
  Textarea,
} from "@/components";

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
      className={styles.section}
    >
      <div className={styles.wrapper}>
        <div className={styles.form_wrapper}>
          <div className={styles.forms_group}>
            <FormItem top={t("form.input.title.name")}>
              <Input placeholder={t("form.input.placeholder.name")} />
            </FormItem>
            <FormItem top={t("form.input.title.contact")}>
              <Input placeholder={t("form.input.placeholder.contact")} />
            </FormItem>
            <FormItem top={t("form.textarea.title.message")}>
              <Textarea placeholder={t("form.textarea.placeholder.message")} />
            </FormItem>
          </div>
          <ButtonGroup>
            <Button before={"button.attach"} mode="secondary" />
            <Button>{t("button.send")}</Button>
          </ButtonGroup>
        </div>
        <div className={styles.bubble_container}>
          <div className={styles.bubble}>Расскажите о своём проекте</div>
          <div className={styles.bubble}>Задавайте вопросы — я на связи</div>
          <div className={styles.bubble}>Ваши идеи вдохновляют!</div>
          <div className={styles.bubble}>Жду вашего сообщения</div>
          <div className={styles.bubble}>Давайте начнём диалог</div>
        </div>
      </div>
    </Section>
  );
};
