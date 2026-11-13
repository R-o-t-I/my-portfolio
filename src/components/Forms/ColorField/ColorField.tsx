import { useTranslation } from "react-i18next";

import styles from "./ColorField.module.scss";

type ColorFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// Валидный hex для свотча: только #rrggbb, иначе пикер приведёт к чёрному
const isValidPickerColor = (value: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value.trim());

export const ColorField = ({
  value,
  onChange,
  placeholder,
}: ColorFieldProps) => {
  const { t } = useTranslation();

  // Цвет для нативного пикера: валидный или нейтральный запасной
  const pickerValue = isValidPickerColor(value) ? value.trim() : "#888888";

  // Разворачиваем #abc в #aabbcc — единый формат в базе и пикере
  const normalize = (raw: string): string | null => {
    if (raw === "") return "";
    const hex = /^#([0-9a-fA-F]{3})$/.exec(raw);
    if (hex) {
      return `#${hex[1]
        .split("")
        .map((c) => c + c)
        .join("")}`;
    }
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
    return null; // невалидно — не пропускаем
  };

  return (
    <div className={styles.wrapper}>
      <label
        className={styles.swatch}
        style={{ background: value || "transparent" }}
        title={t("admin.action.reset_color", "Сбросить цвет")}
      >
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className={styles.nativeInput}
        />
      </label>

      <input
        type="text"
        className={styles.textInput}
        placeholder={
          placeholder ?? t("admin.field.icon_color", "Цвет иконки (#hex)")
        }
        value={value}
        spellCheck={false}
        onChange={(e) => {
          const raw = e.target.value.trim();
          // На лету пропускаем префиксы валидных форматов:
          // можно дописывать посимвольно (#, #a, #ab, #abc...)
          if (raw === "" || /^#[0-9a-fA-F]{0,6}$/.test(raw)) {
            onChange(raw);
          }
        }}
        onBlur={(e) => {
          const normalized = normalize(e.target.value.trim());
          if (normalized !== null) {
            onChange(normalized);
          } else {
            // Невалидный ввод — откатываем к последнему валидному значению
            onChange(value);
          }
        }}
      />

      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange("")}
          aria-label={t("admin.action.remove_color", "Убрать цвет")}
          title={t("admin.action.remove_color", "Убрать цвет")}
        >
          ✕
        </button>
      )}
    </div>
  );
};
