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
  // Публичный список: карточка — ссылка на проект (по умолчанию).
  // Админка: link={false} — карточка не навигирует, а href оставляем
  // для явного «открыть проект», если он понадобится
  link?: boolean;
  // Кнопки поверх карточки (админка): рендерятся в правом верхнем углу
  actions?: React.ReactNode;
  badge?: string | null;
}

export const ProjectCard = ({
  logo = "",
  snippet = "",
  title,
  description,
  category,
  slug,
  link = true,
  actions,
  badge,
}: ProjectCardProps) => {
  const card = (
    <>
      {actions && <div className={styles.actions_overlay}>{actions}</div>}

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
        {badge && <span className={styles.badgeDraft}>{badge}</span>}
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
    </>
  );

  if (!link) {
    return (
      <div className={styles.card} data-slug={slug}>
        {card}
      </div>
    );
  }

  return (
    <Link to={`/project/${slug}`} className={styles.card}>
      {card}
    </Link>
  );
};
