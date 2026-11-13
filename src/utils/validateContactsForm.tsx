import { type TFunction } from "i18next";

export interface FormDataState {
  name: string;
  email: string;
  social: string;
  message: string;
  // ИЗМЕНЕНО: массив файлов вместо одного файла
  files: File[];
}

export interface FormErrorsState {
  name?: string;
  contacts?: string;
  message?: string;
  file?: string;
}

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Валидация ссылки через встроенный парсер URL вместо regex.
 * Принимает адреса с "?", "#", заглавными буквами и кириллическими
 * доменами (сайт.рф) и не уходит в бэктрекинг, как старая регулярка.
 */
const isValidUrl = (value: string): boolean => {
  if (!value) return false;

  try {
    // Нормализация: допускаем ввод без протокола
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;

    const url = new URL(normalized);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.includes(".")
    );
  } catch {
    return false;
  }
};

export const validateContactsForm = (
  data: FormDataState,
  t: TFunction,
): FormErrorsState => {
  const errors: FormErrorsState = {};

  // 1. Валидация имени
  if (!data.name.trim()) {
    errors.name = t("form.error.name_required", "Введите ваше имя");
  } else if (data.name.trim().length < 2) {
    errors.name = t(
      "form.error.name_short",
      "Имя должно быть не короче 2 символов",
    );
  }

  // 2. Валидация группы контактов (Email / Соцсеть)
  const emailTrimmed = data.email.trim();
  const socialTrimmed = data.social.trim();

  const isEmailValid = emailRegex.test(emailTrimmed);
  const isSocialValid = isValidUrl(socialTrimmed);

  const emailError =
    emailTrimmed && !isEmailValid ?
      t(
        "form.error.email_invalid",
        "Адрес электронной почты должен содержать символ «@» и доменную зону",
      )
    : null;
  const socialError =
    socialTrimmed && !isSocialValid ?
      t("form.error.social_invalid", "Введите корректную ссылку (URL)")
    : null;

  if (!emailTrimmed && !socialTrimmed) {
    errors.contacts = t(
      "form.error.contacts_empty",
      "Заполните хотя бы одно поле: Email или Ссылку",
    );
  } else if (emailError && socialError) {
    errors.contacts = t(
      "form.error.contacts_invalid_both",
      "Некорректный формат email и ссылки",
    );
  } else if (emailError) {
    errors.contacts = emailError;
  } else if (socialError) {
    errors.contacts = socialError;
  }

  // 3. Валидация сообщения
  if (!data.message.trim()) {
    errors.message = t("form.error.message_required", "Введите ваше сообщение");
  } else if (data.message.trim().length < 10) {
    errors.message = t(
      "form.error.message_short",
      "Сообщение должно быть не короче 10 символов",
    );
  }

  return errors;
};
