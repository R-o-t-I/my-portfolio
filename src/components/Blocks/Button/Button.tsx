import React from "react";

import styles from "./Button.module.scss";

import { Text } from "@/components";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  before?: React.ReactNode;
  children?: React.ReactNode;
  after?: React.ReactNode;
  mode?: "primary" | "secondary";
  stretched?: boolean;
  href?: string;
  size?: "s" | "m" | "l";
};

export const Button = ({
  before,
  children,
  after,
  mode = "primary",
  stretched = false,
  disabled = false,
  onClick,
  className = "",
  href,
  size = "m",
  type = "button", // По умолчанию ставим "button", чтобы кнопка случайно не сабмитила формы
  ...props // Собираем остальные стандартные пропсы (например, onMouseEnter, id и т.д.)
}: ButtonProps) => {
  // Собираем общие классы для стилизации кнопок и ссылок
  const buttonClasses = `
    ${styles.button}
    ${mode && styles[`mode_${mode}`]}
    ${size && styles[`size_${size}`]}
    ${stretched && styles.stretched}
    ${disabled && styles.disabled}
    ${className}
  `.trim();

  // Содержимое кнопки (иконки и текст) выносим в отдельную переменную, чтобы не дублировать код
  const content = (
    <>
      {before && <div className={styles.before}>{before}</div>}
      {children && (
        <div className={styles.children}>
          <Text variant="span" className={styles.text} size="sm">
            {children}
          </Text>
        </div>
      )}
      {after && <div className={styles.after}>{after}</div>}
    </>
  );

  // Если передан href, рендерим семантическую ссылку <a>, стилизованную под кнопку
  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        className={buttonClasses}
        // Если ссылка отключена, делаем её недоступной для фокуса
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
      >
        {content}
      </a>
    );
  }

  // Иначе рендерим стандартную кнопку <button>
  return (
    <button
      {...props} // Прокидываем все стандартные атрибуты
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonClasses}
    >
      {content}
    </button>
  );
};
