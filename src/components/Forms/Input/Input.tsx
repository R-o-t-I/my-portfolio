import React, { forwardRef, type InputHTMLAttributes } from "react";

import styles from "./Input.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ isError, className = "", ...props }, ref) => {
    // Собираем массив активных классов
    const inputClasses = [
      styles.input, // Базовый класс из SCSS
      isError ? styles.inputError : "",
      className, // Внешние классы
    ]
      .filter(Boolean)
      .join(" "); // Убираем пустые строки и соединяем пробелом

    return <input ref={ref} className={inputClasses} {...props} />;
  },
);

Input.displayName = "Input";
