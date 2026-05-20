import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../../utils";

import styles from "./Project.module.scss";

import { Section, Text, Title } from "@/components";

// Строгие интерфейсы для TypeScript под JSONB структуру
interface LocalizedField {
  ru: string;
  en?: string | null;
}

interface ProjectItem {
  id: string;
  slug: string;
  created_at: string;
  category_id: string | null;
  title: LocalizedField;
  description: LocalizedField;
  description_mini: LocalizedField;
  logo_url: LocalizedField;
  snippet_url: LocalizedField;
  category_info: {
    id: string;
    slug: string;
    name: LocalizedField;
  } | null;
}

export const Project = () => {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Вычисляем текущий язык ('ru' или 'en')
  const currentLang = i18n.language.startsWith("ru") ? "ru" : "en";

  useEffect(() => {
    window.scrollTo(0, 0); // Прокрутка вверх при открытии проекта

    const getProject = async () => {
      try {
        // Подгружаем проект вместе со связанной информацией о категории
        const { data, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            category_info:projects_categories (*)
          `,
          )
          .eq("slug", slug)
          .single();

        if (error || !data) {
          navigate("/");
          return;
        }

        setProject(data as unknown as ProjectItem);
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) getProject();
  }, [slug, navigate]);

  // Извлекаем локализованные данные с автоматическим фолбэком на 'ru'
  const projectDetails = useMemo(() => {
    if (!project) return null;

    return {
      title: project.title[currentLang] || project.title.ru,
      description: project.description[currentLang] || project.description.ru,
      description_mini:
        project.description_mini[currentLang] || project.description_mini.ru,
      logo: project.logo_url[currentLang] || project.logo_url.ru,
      snippet: project.snippet_url[currentLang] || project.snippet_url.ru,
      categoryName:
        project.category_info ?
          project.category_info.name[currentLang] ||
          project.category_info.name.ru
        : "",
    };
  }, [project, currentLang]);

  // Управление заголовком вкладки браузера (учитываем язык)
  useEffect(() => {
    if (projectDetails?.title) {
      const baseTitle =
        currentLang === "ru" ?
          "Веб-разработчик и дизайнер – Александр Тихонович"
        : "Web Developer & Designer – Alexander Tikhonovich";

      document.title = `${projectDetails.title} | ${baseTitle}`;
    }

    return () => {
      document.title = "Веб-разработчик и дизайнер – Александр Тихонович";
    };
  }, [projectDetails, currentLang]);

  return (
    <Section className={styles.wrapper}>
      {isLoading ?
        <Text>Загружаем проект...</Text>
      : projectDetails && (
          <div className={styles.container}>
            <button className={styles.back_btn} onClick={() => navigate(-1)}>
              {currentLang === "ru" ? "← Назад" : "← Back"}
            </button>

            <div className={styles.header}>
              <div className={styles.info}>
                <span className={styles.category}>
                  {projectDetails.categoryName}
                </span>
                <div className={styles.middle}>
                  <Title className={styles.title}>{projectDetails.title}</Title>
                  <Text className={styles.description_mini}>
                    {projectDetails.description_mini}
                  </Text>
                </div>
              </div>
              <div className={styles.logo_wrapper}>
                {projectDetails.logo && (
                  <img
                    src={projectDetails.logo}
                    alt="Logo"
                    className={styles.logo}
                  />
                )}
              </div>
            </div>

            <div className={styles.content}>
              {projectDetails.snippet && (
                <img
                  src={projectDetails.snippet}
                  alt={projectDetails.title}
                  className={styles.image}
                />
              )}
            </div>
          </div>
        )
      }
    </Section>
  );
};
