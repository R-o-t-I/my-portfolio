import React from "react";

import styles from "./ButtonGroup.module.scss";

interface ButtonGroupProps {
  children?: React.ReactNode;
  direction?: "row" | "column";
  gap?: "s" | "m" | "l";
  align?: "left" | "center" | "right";
  stretched?: boolean;
  className?: string;
}

export const ButtonGroup = ({
  children,
  direction = "row",
  gap = "m",
  align = "left",
  stretched = false,
  className = "",
}: ButtonGroupProps): React.ReactNode => {
  return (
    <div
      className={`
        ${styles.wrapper}
        ${direction && styles[`direction_${direction}`]}
        ${gap && styles[`gap_${gap}`]}
        ${styles[`align_${align}`]}
        ${stretched && styles.stretched}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
