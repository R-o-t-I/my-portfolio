import React, {
  useId,
  type ReactNode,
  isValidElement,
  cloneElement,
} from "react";

import styles from "./FormItem.module.scss";

import { Text } from "../../index";

interface FormItemProps {
  top?: ReactNode;
  children?: ReactNode;
  bottom?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const FormItem = ({
  top,
  children,
  bottom,
  className = "",
  disabled,
}: FormItemProps) => {
  const generatedId = useId();

  // Проверяем, является ли children валидным React-элементом
  const renderChildren = () => {
    if (isValidElement(children)) {
      // Вытаскиваем существующий id из пропсов инпута, если он там есть
      const childId = (children.props as { id?: string }).id || generatedId;

      // Клонируем только если это реально элемент (инпут, селект и т.д.)
      return cloneElement(children, {
        id: childId,
        disabled:
          disabled || (children.props as { disabled?: boolean }).disabled,
      } as React.HTMLAttributes<HTMLElement>);
    }
    return children;
  };

  // Определяем ID для label (берем из дочернего элемента или используем сгенерированный)
  const labelFor =
    isValidElement(children) ?
      (children.props as { id?: string }).id || generatedId
    : undefined;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {top && (
        <label htmlFor={labelFor}>
          <Text size="xs" mode="secondary" className={styles.top}>
            {top}
          </Text>
        </label>
      )}

      <div className={`${styles.children} ${disabled ? styles.disabled : ""}`}>
        {renderChildren()}
      </div>

      {bottom && (
        <Text size="xs" mode="secondary" className={styles.bottom}>
          {bottom}
        </Text>
      )}
    </div>
  );
};
