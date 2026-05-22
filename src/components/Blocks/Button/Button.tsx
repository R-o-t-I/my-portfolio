import React from "react";

import styles from "./Button.module.scss";

import { Text } from "@/components";

// Объединяем атрибуты кнопки и ссылки, чтобы TypeScript разрешал href, target, rel и т.д.
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
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
  type = "button",
  target,
  rel,
  ...props // Сюда теперь безопасно попадут target, rel и остальные пропсы ссылки
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

  // Содержимое кнопки (иконки и текст)
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
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)} // Приведение типа для безопасности деструктуризации
        href={disabled ? undefined : href}
        target={target}
        rel={rel}
        className={buttonClasses}
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
      >
        {content}
      </a>
    );
  }

  // Иначе рендерим стандартную кнопку <button>
  return (
    <button
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonClasses}
    >
      {content}
    </button>
  );
};
