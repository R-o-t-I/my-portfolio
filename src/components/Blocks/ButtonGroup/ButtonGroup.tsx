import React from "react";

import styles from "./ButtonGroup.module.scss";

interface ButtonGroupProps {
  children?: React.ReactNode;
  direction?: "row" | "column";
  gap?: "s" | "m" | "l";
  stretched?: boolean;
  className?: string;
}

export const ButtonGroup = ({
  children,
  direction = "row",
  gap = "m",
  stretched = false,
  className = "",
}: ButtonGroupProps): React.ReactNode => {
  return (
    <div
      className={`
        ${styles.wrapper}
        ${direction && styles[`direction_${direction}`]}
        ${gap && styles[`gap_${gap}`]}
        ${stretched && styles.stretched}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
