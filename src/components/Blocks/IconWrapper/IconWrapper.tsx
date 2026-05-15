import React from "react";

import styles from "./IconWrapper.module.scss";

interface IconWrapperProps {
  children: React.ReactNode; // Сюда передаем <path> или весь <svg>
  size?: number | string;
  className?: string;
  color?: string;
  viewBox?: string;
  thereColor?: boolean;
  fill?: string;
}

export const IconWrapper = ({
  children,
  size = 28,
  className = "",
  color = "currentColor",
  viewBox = "0 0 28 28",
  thereColor = false,
  fill,
}: IconWrapperProps) => {
  const computedViewBox = viewBox || `0 0 ${size} ${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={computedViewBox}
      fill={fill}
      strokeWidth={0}
      preserveAspectRatio="xMidYMid meet"
      className={`${!thereColor ? styles.icon : ""} ${className}`.trim()}
      style={{ color }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
};
