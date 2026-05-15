import React, { type ReactNode } from "react";

import { FormItemContext } from "./FormItemContext";

import styles from "./FormItem.module.scss";

import { Text } from "../../index";

interface FormItemProps {
  id: string;
  top?: ReactNode;
  children?: ReactNode;
  bottom?: ReactNode;
  className?: string;
  disabled?: boolean;
  error?: string; // Добавляем необязательное свойство для текста ошибки
}

export const FormItem = ({
  id,
  top,
  children,
  bottom,
  className = "",
  disabled,
  error,
}: FormItemProps) => {
  return (
    <FormItemContext.Provider value={{ id, disabled, isError: !!error }}>
      <div className={`${styles.wrapper} ${className}`}>
        {top && (
          <label htmlFor={id}>
            <Text size="xs" mode="secondary" className={styles.top}>
              {top}
            </Text>
          </label>
        )}

        <div
          className={`${styles.children} ${disabled ? styles.disabled : ""}`}
        >
          {children}
        </div>

        {error ?
          <Text size="xs" className={styles.error_text}>
            {error}
          </Text>
        : bottom ?
          <Text size="xs" mode="secondary" className={styles.bottom}>
            {bottom}
          </Text>
        : null}
      </div>
    </FormItemContext.Provider>
  );
};
