type Localized = { ru?: string; en?: string } | string | null | undefined;

// Выбирает текст на текущем языке, с фолбэками на другой язык и на старый строковый формат
export const pickLocalized = (value: Localized, language: string): string => {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;

  const lang = language.startsWith("ru") ? "ru" : "en";
  return value[lang] ?? value.ru ?? value.en ?? "";
};
