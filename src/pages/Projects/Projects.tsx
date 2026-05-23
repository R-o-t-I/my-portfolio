import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../../utils";

import styles from "./Projects.module.scss";

import {
  ProjectCard,
  Section,
  Tabs,
  TabsItem,
  Text,
  Title,
} from "@/components";

// Строгие интерфейсы для TypeScript под JSONB структуру
interface LocalizedField {
  ru: string;
  en?: string | null;
}

interface CategoryItem {
  id: string;
  slug: string;
  name: LocalizedField;
}

interface ProjectItem {
  id: string;
  slug: string;
  created_at: string;
  category_id: string | null;
  title: LocalizedField;
  description: LocalizedField;
  logo_url: LocalizedField;
  snippet_url: LocalizedField;
  category_info: CategoryItem | null;
}

export const Projects = () => {
  const { t, i18n } = useTranslation();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] =
    useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Определяем текущий язык ('ru' или 'en')
  const currentLang = i18n.language.startsWith("ru") ? "ru" : "en";

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      setIsLoading(true);

      // Параллельно загружаем проекты и список всех категорий для фильтра
      const [projectsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from("projects")
          .select(
            `
            *,
            category_info:projects_categories (*)
          `,
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("projects_categories")
          .select("*")
          .order("display_order", { ascending: true }),
      ]);

      if (projectsResponse.data) {
        setProjects(projectsResponse.data as unknown as ProjectItem[]);
      }
      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data as unknown as CategoryItem[]);
      }

      if (projectsResponse.error)
        console.error("Ошибка проектов:", projectsResponse.error.message);
      if (categoriesResponse.error)
        console.error("Ошибка категорий:", categoriesResponse.error.message);

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Фильтруем массив проектов в зависимости от выбранного таба
  const filteredProjects = useMemo(() => {
    if (selectedCategorySlug === "all") return projects;
    return projects.filter(
      (project) => project.category_info?.slug === selectedCategorySlug,
    );
  }, [projects, selectedCategorySlug]);

  return (
    <Section className={styles.wrapper}>
      <div>
        <Title>{t("page.projects.title")}</Title>
      </div>

      {categories.length > 0 && (
        <Tabs
          selectedId={selectedCategorySlug}
          onSelectedIdChange={(id) => setSelectedCategorySlug(id)}
          layoutFillMode="auto"
          withScrollToSelectedTab
        >
          <TabsItem id="all">
            {currentLang === "ru" ? "Все проекты" : "All projects"}
          </TabsItem>

          {categories.map((cat) => {
            const categoryName = cat.name[currentLang] || cat.name.ru;
            return (
              <TabsItem key={cat.id} id={cat.slug}>
                {categoryName}
              </TabsItem>
            );
          })}
        </Tabs>
      )}

      {/* Сетка проектов */}
      <div className={styles.projects_grid}>
        {isLoading ?
          <Text>Загружаем проекты...</Text>
        : filteredProjects.length === 0 ?
          <Text>
            {currentLang === "ru" ? "Проекты не найдены" : "No projects found"}
          </Text>
        : filteredProjects.map((item) => {
            // Безопасное извлечение локализованных данных с фолбэком
            const title = item.title[currentLang] || item.title.ru;
            const description =
              item.description[currentLang] || item.description.ru;
            const logo = item.logo_url[currentLang] || item.logo_url.ru;
            const snippet =
              item.snippet_url[currentLang] || item.snippet_url.ru;

            const categoryName =
              item.category_info ?
                item.category_info.name[currentLang] ||
                item.category_info.name.ru
              : "";

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
