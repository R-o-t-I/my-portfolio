import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useContactsForm } from "@/hooks/useContactsForm";

import styles from "./ContactsSection.module.scss";

import {
  Button,
  ButtonGroup,
  FormItem,
  Input,
  Section,
  Text,
  Textarea,
} from "@/components";

import { IconAttach } from "@/assets/icons";

interface ContactsSectionProps {
  id?: string;
}

export const ContactsSection = ({ id }: ContactsSectionProps) => {
  const { t } = useTranslation();

  const {
    formData,
    errors,
    isSubmitting,
    cooldownLeft,
    fileInputRef,
    handleChange,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
  } = useContactsForm(
    () => alert(t("Сообщение отправлено")),
    (err) => {
      console.error("Ошибка отправки формы:", err);
      alert(t("Произошла ошибка при отправке. Пожалуйста, попробуйте позже."));
    },
  );

  const bubbles = useMemo(
    () => [
      t("section.contacts.bubbles.project", "Расскажите о своём проекте"),
      t("section.contacts.bubbles.questions", "Задавайте вопросы — я на связи"),
      t("section.contacts.bubbles.ideas", "Ваши идеи вдохновляют!"),
      t("section.contacts.bubbles.waiting", "Жду вашего сообщения"),
      t("section.contacts.bubbles.dialogue", "Давайте начнём диалог"),
    ],
    [t],
  );

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Section
      id={id}
      title={t("section.contacts.title")}
      subtitle={t("section.contacts.subtitle")}
      className={styles.section}
    >
      <div className={styles.wrapper}>
        <form
          onSubmit={handleSubmit}
          className={styles.form_wrapper}
          noValidate
        >
          <div className={styles.forms_group}>
            <FormItem
              id="form-name"
              error={errors.name}
              top={t("form.input.title.name")}
            >
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("form.input.placeholder.name")}
                type="text"
                autoComplete="given-name"
                disabled={isSubmitting}
              />
            </FormItem>

            <FormItem
              id="form-contacts"
              error={errors.contacts}
              top={t("form.input.title.contact")}
            >
              <div className={styles.input_group}>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("form.input.placeholder.email")}
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                />
                <span className={styles.and_or}>
                  {t("other.and")}/{t("other.or")}
                </span>
                <Input
                  name="social"
                  value={formData.social}
                  onChange={handleChange}
                  placeholder={t("form.input.placeholder.social")}
                  id="form-social"
                  type="url"
                  disabled={isSubmitting}
                />
              </div>
            </FormItem>

            <FormItem
              id="form-message"
              error={errors.message}
              top={t("form.textarea.title.message")}
            >
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t("form.textarea.placeholder.message")}
                maxRows={6}
                disabled={isSubmitting}
              />
            </FormItem>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={isSubmitting}
          />

          {formData.file && (
            <div className={styles.file_badge}>
              <Text size="xs" className={styles.name}>
                📎 {formData.file.name}
              </Text>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isSubmitting}
                aria-label={t("form.file.remove_aria", "Удалить файл")}
              >
                <Text size="xs" className={styles.remove_file_btn}>
                  ✕
                </Text>
              </button>
            </div>
          )}

          {errors.file && (
            <Text size="xs" className={styles.file_error}>
              {errors.file}
            </Text>
          )}

          <ButtonGroup>
            <Button type="submit" disabled={isSubmitting || cooldownLeft > 0}>
              {isSubmitting ?
                t("button.sending")
              : cooldownLeft > 0 ?
                `${t("button.send")} (${cooldownLeft}s)`
              : t("button.send")}
            </Button>

            <Button
              type="button"
              before={<IconAttach size={20} />}
              mode="secondary"
              disabled={isSubmitting || cooldownLeft > 0}
              onClick={handleAttachClick}
              aria-label={t("form.button.attach_file_aria", "Прикрепить файл")}
            />
          </ButtonGroup>
        </form>

        <div className={styles.bubble_container}>
          {bubbles.map((text, index) => (
            <div key={index} className={styles.bubble}>
              {text}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
