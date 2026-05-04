import React from "react";

import styles from "./IconWrapper.module.scss";

interface IconWrapperProps {
  children: React.ReactNode; // Сюда передаем <path> или весь <svg>
  size?: number | string;
  className?: string;
  color?: string;
  viewBox?: string;
}

export const IconWrapper = ({
  children,
  size = 28,
  className = "",
  color = "currentColor",
  viewBox = "0 0 28 28",
}: IconWrapperProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      strokeWidth={0}
      className={`${styles.icon} ${className}`}
      style={{ color }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
};
