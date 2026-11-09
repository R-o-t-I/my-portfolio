import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend) // Загружает файлы из /public/locales
  .use(LanguageDetector) // Запоминает выбор пользователя
  .use(initReactI18next)
  .init({
    // ИСПРАВЛЕНО: Резервным языком (если у пользователя в браузере, например, французский)
    // делаем английский, чтобы сайт оставался международным для зарубежных клиентов
    fallbackLng: "en",

    ns: ["translation"],
    defaultNS: "translation",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    // ДОБАВЛЕНО: Настройка плагина детекции для идеальной стыковки с index.html
    detection: {
      order: ["localStorage", "navigator"], // Сначала смотрим, что сохранено, потом на систему
      caches: ["localStorage"], // Кешируем строго в localStorage (запишет ключ i18nextLng)
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
