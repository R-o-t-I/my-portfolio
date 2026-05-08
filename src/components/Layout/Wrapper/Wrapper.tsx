// главный компонент, который объединяет Header + Main + Footer
import React from "react";

import styles from "./Wrapper.module.scss";

interface WrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const Wrapper = ({ children, className = "" }: WrapperProps) => {
  return (
    <div
      className={`
        ${styles.wrapper}
        ${className}
      `}
    >
      <div className={styles.content}>{children}</div>
    </div>
  );
};
