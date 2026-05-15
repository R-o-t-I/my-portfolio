import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  validateContactsForm,
  supabase,
  type FormDataState,
  type FormErrorsState,
} from "@/utils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояние полей формы
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    email: "",
    social: "",
    message: "",
    file: null, // Изначально файла нет
  });

  // Состояние ошибок
  const [errors, setErrors] = useState<FormErrorsState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обработчик текстовых полей
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name" && errors.name)
      setErrors((prev) => ({ ...prev, name: undefined }));
    if (name === "message" && errors.message)
      setErrors((prev) => ({ ...prev, message: undefined }));
    if ((name === "email" || name === "social") && errors.contacts) {
      setErrors((prev) => ({ ...prev, contacts: undefined }));
    }
  };

  // Обработчик выбора файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      // Валидация размера файла
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          file: "Файл слишком большой. Максимум 10 МБ",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, file: selectedFile }));
      setErrors((prev) => ({ ...prev, file: undefined })); // сбрасываем ошибку файла
    }
  };

  // Функция удаления прикрепленного файла
  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formErrors = validateContactsForm(formData);
    if (Object.keys(formErrors).length > 0 || errors.file) {
      setErrors((prev) => ({ ...prev, ...formErrors }));
      return;
    }

    try {
      setIsSubmitting(true);
      let uploadedFileUrl = null;

      // 1. Если файл прикреплен, загружаем его в Supabase Storage
      if (formData.file) {
        // Формируем уникальное имя файла, чтобы избежать перезаписи (timestamp + имя)
        const fileExt = formData.file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, formData.file);

        if (uploadError) throw uploadError;

        // Получаем публичную ссылку на загруженный файл
        const { data: publicUrlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(filePath);

        uploadedFileUrl = publicUrlData.publicUrl;
      }

      // 2. Сохраняем текстовые данные и ссылку на файл в таблицу 'contacts'
      const { error: insertError } = await supabase.from("contacts").insert([
        {
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          social: formData.social.trim() || null,
          message: formData.message.trim(),
          file_url: uploadedFileUrl, // Передаем URL файла в базу данных
        },
      ]);

      if (insertError) throw insertError;

      alert("Сообщение и файл успешно отправлены!");

      // Полный сброс формы
      setFormData({ name: "", email: "", social: "", message: "", file: null });
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Ошибка отправки данных:", err);
      alert("Произошла ошибка при отправке. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
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

          <React.Fragment>
            {/* Скрытый нативный инпут для выбора файлов */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={isSubmitting}
              //accept="image/*,application/pdf,.doc,.docx" // Ограничение на типы файлов
            />

            {/* Индикатор прикрепленного файла */}
            {formData.file && (
              <div className={styles.file_badge}>
                <Text size="xs" className={styles.name}>
                  📎 {formData.file.name}
                </Text>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isSubmitting}
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
          </React.Fragment>

          <ButtonGroup>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Отправка..." : t("button.send")}
            </Button>
            {/* Кнопка скрепки триггерит клик по скрытому инпуту */}
            <Button
              type="button"
              before={<IconAttach size={20} />}
              mode="secondary"
              disabled={isSubmitting}
              onClick={() => fileInputRef.current?.click()}
            />
          </ButtonGroup>
        </form>

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
