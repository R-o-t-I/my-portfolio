import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../utils";

import styles from "./ProjectsSection.module.scss";

import { Button, ProjectCard, Section } from "@/components";

interface ProjectsSectionProps {
  id?: string;
}

interface LocalizedField {
  ru?: string | null; // Сделали опциональным, т.к. из БД может прийти NULL
  en?: string | null;
}

interface ProjectCategory {
  id: string;
  slug: string;
  name: LocalizedField;
  icon: LocalizedField;
}

interface ProjectItem {
  id: string;
  slug: string;
  category_id: string | null;
  title: LocalizedField;
  description: LocalizedField;
  logo_url: LocalizedField;
  snippet_url: LocalizedField;
  category: ProjectCategory | null;
}

export const ProjectsSection = ({ id }: ProjectsSectionProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentLang = i18n.language.startsWith("ru") ? "ru" : "en";

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          category:projects_categories (*)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(6);

      if (data) setProjects(data as unknown as ProjectItem[]);
      if (error) console.error("Ошибка загрузки проектов:", error.message);
      setIsLoading(false);
    };

    fetchProjects();
  }, []);

  return (
    <Section
      id={id}
      title={t("section.projects.title")}
      subtitle={t("section.projects.subtitle")}
      after={
        <Button onClick={() => navigate("/projects")} mode="secondary">
          {t("section.projects.after")}
        </Button>
      }
      className={styles.wrapper}
    >
      <div className={styles.projects_grid}>
        {isLoading ?
          <p>Загружаем проекты...</p>
        : projects.map((item) => {
            const title = item.title?.[currentLang] ?? item.title?.ru ?? "";
            const description =
              item.description?.[currentLang] ?? item.description?.ru ?? "";
            const logo =
              item.logo_url?.[currentLang] ?? item.logo_url?.ru ?? "";
            const snippet =
              item.snippet_url?.[currentLang] ?? item.snippet_url?.ru ?? "";

            const categoryName =
              item.category?.name?.[currentLang] ??
              item.category?.name?.ru ??
              "";

            return (
              <ProjectCard
                key={item.id}
                slug={item.slug}
                logo={logo}
                snippet={snippet}
                title={title}
                description={description}
                category={categoryName}
              />
            );
          })
        }
      </div>
    </Section>
  );
};
