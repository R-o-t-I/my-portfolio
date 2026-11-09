import { Link } from "react-router-dom";

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
  return (
    <Link to={`/project/${slug}`} className={styles.card}>
      <div className={styles.snippet_wrapper}>
        {snippet && (
          <img
            className={styles.snippet}
            src={snippet}
            alt={title}
            loading="lazy"
            decoding="async"
          />
        )}
        <div className={styles.category_wrapper}>{category}</div>
      </div>

      <div className={styles.middle}>
        <div className={styles.header}>
          {logo && (
            <div className={styles.logo_wrapper}>
              <img
                className={styles.logo}
                src={logo}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <Text size="lg" className={styles.title}>
            {title}
          </Text>
        </div>
        {description && (
          <Text mode="secondary" className={styles.description}>
            {description}
          </Text>
        )}
      </div>
    </Link>
  );
};
