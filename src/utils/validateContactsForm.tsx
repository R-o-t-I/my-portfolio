import { type TFunction } from "i18next";

export interface FormDataState {
  name: string;
  email: string;
  social: string;
  message: string;
  file: File | null;
}

export interface FormErrorsState {
  name?: string;
  contacts?: string;
  message?: string;
  file?: string;
}

export const validateContactsForm = (
  data: FormDataState,
  t: TFunction, // Безопасная типизация для i18next, убирающая ошибки компиляции TS
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

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const urlRegex =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

  const isEmailValid = emailRegex.test(emailTrimmed);
  const isSocialValid = urlRegex.test(socialTrimmed);

  // Сценарий А: Оба поля абсолютно пустые
  if (!emailTrimmed && !socialTrimmed) {
    errors.contacts = t(
      "form.error.contacts_empty",
      "Заполните хотя бы одно поле: Email или Ссылку",
    );
  }
  // Сценарий Б: Пользователь пытался заполнить оба поля, но оба содержат ошибки
  else if (emailTrimmed && !isEmailValid && socialTrimmed && !isSocialValid) {
    errors.contacts = t(
      "form.error.contacts_invalid_both",
      "Некорректный формат email и ссылки",
    );
  }
  // Сценарий В: Заполнено только поле Email, но с ошибкой
  else if (emailTrimmed && !isEmailValid && !socialTrimmed) {
    errors.contacts = t(
      "form.error.email_invalid",
      "Адрес электронной почты должен содержать символ «@» и доменную зону",
    );
  }
  // Сценарий Г: Заполнено только поле Ссылки, но с ошибкой
  else if (socialTrimmed && !isSocialValid && !emailTrimmed) {
    errors.contacts = t(
      "form.error.social_invalid",
      "Введите корректную ссылку (URL)",
    );
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
