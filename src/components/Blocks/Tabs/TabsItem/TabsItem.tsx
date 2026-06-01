import React from "react";
import styles from "./TabsItem.module.scss";
import { Text } from "@/components";

export interface TabsItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  selected?: boolean;
  disabled?: boolean;
  before?: React.ReactNode;
  after?: React.ReactNode;
  status?: number | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  "data-mode"?: "default" | "secondary" | "accent";
}

export const TabsItem = ({
  id,
  selected = false,
  disabled = false,
  before,
  after,
  status,
  children,
  className = "",
  onClick,
  "data-mode": mode = "accent",
  ...props
}: TabsItemProps) => {
  return (
    <button
      {...props}
      id={id}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        ${styles.tabs_item}
        ${styles[`mode_${mode}`]}
        ${selected ? styles.item_selected : ""}
        ${disabled ? styles.item_disabled : ""}
        ${className}
      `.trim()}
      aria-selected={selected}
      role="tab"
    >
      {before && <span className={styles.item_before}>{before}</span>}

      {children && (
        <Text size="sm" className={styles.item_content}>
          {children}
        </Text>
      )}

      {status !== undefined && (
        <span className={styles.item_status}>
          {typeof status === "number" ?
            <span className={styles.status_counter}>{status}</span>
          : status}
        </span>
      )}

      {after && <span className={styles.item_after}>{after}</span>}
    </button>
  );
};
