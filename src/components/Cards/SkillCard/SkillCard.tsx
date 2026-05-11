import React from "react";

import styles from "./SkillCard.module.scss";

import { Text } from "@/components";

interface SkillCardProps {
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const SkillCard = ({ icon, children }: SkillCardProps) => {
  return (
    <div className={styles.card}>
      {icon && <div className={styles.icon_wrapper}>{icon}</div>}
      {children && <Text>{children}</Text>}
    </div>
  );
};
