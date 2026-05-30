import React from "react";

import { useNavigate } from "react-router-dom";

import styles from "./ProjectCard.module.scss";

import { Text } from "@/components";

interface ProjectCardProps {
  logo?: string;
  snippet?: string;
  title: string;
  description: string;
  category?: string;
  slug: string;
}

export const ProjectCard = ({
  logo = "",
  snippet = "",
  title,
  description,
  category,
  slug,
}: ProjectCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Здесь можно добавить проигрывание звука клика, если хочешь
    // playClickSound();

    // Выполняем переход программно
    navigate(`/project/${slug}`);
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.snippet_wrapper}>
        {snippet && <img className={styles.snippet} src={snippet} />}
        <div className={styles.category_wrapper}>{category}</div>
      </div>

      <div className={styles.middle}>
        <div className={styles.header}>
          {logo && (
            <div className={styles.logo_wrapper}>
              <img className={styles.logo} src={logo} />
            </div>
          )}
          <Text size="lg" className={styles.title}>
            {title}
          </Text>
        </div>
        <Text mode="secondary" className={styles.description}>
          {description}
        </Text>
      </div>
    </div>
  );
};
