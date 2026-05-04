//обертка для секций с отступами (padding)
import React from "react";

import styles from "./Separator.module.scss";

interface SeparatorProps {
  direction?: "horizontal" | "vertical";
  className?: string;
}

export const Separator = ({
  direction = "horizontal",
  className = "",
}: SeparatorProps) => {
  return (
    <div
      className={`
        ${styles.separator}
        ${direction && styles[`direction_${direction}`]}
        ${className}
      `}
    />
  );
};
