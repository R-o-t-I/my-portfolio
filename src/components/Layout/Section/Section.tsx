//обертка для секций с отступами (padding)
import React from "react";

import styles from "./Section.module.scss";

import { Text, Title } from "@/components";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  after?: React.ReactNode;
}

export const Section = ({
  children,
  className = "",
  id = "",
  title,
  subtitle,
  after,
}: SectionProps) => {
  return (
    <section id={id} className={`${className} ${styles.section}`}>
      {(title || subtitle) && (
        <div className={styles.header}>
          <div className={styles.middle}>
            {title && (
              <Text size="xs" mode="secondary" uppercase>
                {title}
              </Text>
            )}
            {subtitle && <Title>{subtitle}</Title>}
          </div>
          {after && <div>{after}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
