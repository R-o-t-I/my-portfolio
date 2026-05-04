import React from "react";

import styles from "./Button.module.scss";

import { Text } from "@/components";

type ButtonProps = {
  before?: React.ReactNode;
  children?: React.ReactNode;
  after?: React.ReactNode;
  mode?: "primary" | "secondary";
  stretched?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
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
}: ButtonProps): React.ReactNode => {
  return (
    <button
      onClick={href ? undefined : onClick}
      className={`
        ${styles.button}
        ${mode && styles[`mode_${mode}`]}
        ${size && styles[`size_${size}`]}
        ${stretched && styles.stretched}
        ${disabled && styles.disabled}
        ${className}
      `}
      tabIndex={0}
    >
      {before && (
        <div
          className={`
          ${styles.before}
        `}
        >
          {before}
        </div>
      )}
      {children && (
        <div className={styles.children}>
          <Text variant="span" className={styles.text} size="sm">
            {children}
          </Text>
        </div>
      )}
      {after && (
        <div
          className={`
          ${styles.after}
        `}
        >
          {after}
        </div>
      )}
      {href && <a href={href} className={styles.link} />}
    </button>
  );
};
