import React, { forwardRef, type InputHTMLAttributes, useContext } from "react";

import { FormItemContext } from "../FormItem/FormItemContext";

import styles from "./Input.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ isError, className = "", id, disabled, ...props }, ref) => {
    // Получаем значения из контекста FormItem (если инпут обернут в FormItem)
    const context = useContext(FormItemContext);

    // Приоритет: явный проп из параметров -> значение из контекста -> undefined
    const finalId = id || context?.id;
    const finalDisabled = disabled || context?.disabled;

    // Собираем массив активных классов
    const inputClasses = [
      styles.input,
      isError ? styles.inputError : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <input
        ref={ref}
        id={finalId}
        disabled={finalDisabled}
        className={inputClasses}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
