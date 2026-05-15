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

export const validateContactsForm = (data: FormDataState): FormErrorsState => {
  const errors: FormErrorsState = {};

  // 1. Валидация имени
  if (!data.name.trim()) {
    errors.name = "Введите ваше имя";
  } else if (data.name.trim().length < 2) {
    errors.name = "Имя должно быть не короче 2 символов";
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
    errors.contacts = "Заполните хотя бы одно поле: Email или Ссылку";
  }
  // Сценарий Б: Пользователь пытался заполнить оба поля, но оба содержат ошибки
  else if (emailTrimmed && !isEmailValid && socialTrimmed && !isSocialValid) {
    errors.contacts = "Некорректный формат email и ссылки";
  }
  // Сценарий В: Заполнено только поле Email, но с ошибкой
  else if (emailTrimmed && !isEmailValid && !socialTrimmed) {
    errors.contacts =
      "Адрес электронной почты должен содержать символ «@» и доменную зону";
  }
  // Сценарий Г: Заполнено только поле Ссылки, но с ошибкой
  else if (socialTrimmed && !isSocialValid && !emailTrimmed) {
    errors.contacts = "Введите корректную ссылку (URL)";
  }

  // Если хотя бы одно из полей заполнено верно (isEmailValid || isSocialValid) —
  // мы не выдаем ошибку contacts, форма успешно отправится в Supabase!

  // 3. Валидация сообщения
  if (!data.message.trim()) {
    errors.message = "Введите ваше сообщение";
  } else if (data.message.trim().length < 10) {
    errors.message = "Сообщение должно быть не короче 10 символов";
  }

  return errors;
};
