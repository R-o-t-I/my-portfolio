import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../../utils";

import styles from "./Projects.module.scss";

import {
  Dropdown,
  ProjectCard,
  Section,
  Tabs,
  TabsItem,
  Text,
  Title,
} from "@/components";

// Строгие интерфейсы для TypeScript под JSONB структуру
interface LocalizedField {
  ru?: string | null; // Сделали опциональным, т.к. из БД может прийти NULL
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

type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc";

export const Projects = () => {
  const { t, i18n } = useTranslation();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] =
    useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // fullWidth для Dropdown: включаем только на мобильных разрешениях
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 480px)").matches,
  );

  // Определяем текущий язык ('ru' или 'en')
  const currentLang = i18n.language.startsWith("ru") ? "ru" : "en";

  // Отслеживаем переход через мобильный брейкпоинт
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 480px)");
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Флаг актуальности: защита от гонки запросов при быстрой навигации
    let isActual = true;

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

      if (!isActual) return;

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

    return () => {
      isActual = false;
    };
  }, []);

  // Фильтрация по категории + сортировка по выбранному варианти
  const filteredProjects = useMemo(() => {
    const filtered =
      selectedCategorySlug === "all" ? projects : (
        projects.filter(
          (project) => project.category_info?.slug === selectedCategorySlug,
        )
      );

    const sorted = [...filtered];

    if (sortOption === "date_desc" || sortOption === "date_asc") {
      const direction = sortOption === "date_desc" ? -1 : 1;
      sorted.sort(
        (a, b) =>
          direction *
          (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      );
    } else {
      const direction = sortOption === "name_asc" ? 1 : -1;
      sorted.sort((a, b) => {
        const nameA = (a.title?.[currentLang] ?? a.title?.ru ?? "")
          .toLowerCase()
          .trim();
        const nameB = (b.title?.[currentLang] ?? b.title?.ru ?? "")
          .toLowerCase()
          .trim();
        return (
          direction *
          nameA.localeCompare(nameB, currentLang === "ru" ? "ru" : "en")
        );
      });
    }

    return sorted;
  }, [projects, selectedCategorySlug, sortOption, currentLang]);

  // Порядок ключей = порядок пунктов в меню
  const sortLabels: Record<SortOption, string> = {
    date_desc: currentLang === "ru" ? "Сначала новые" : "Newest first",
    date_asc: currentLang === "ru" ? "Сначала старые" : "Oldest first",
    name_asc: currentLang === "ru" ? "От А до Я" : "A to Z",
    name_desc: currentLang === "ru" ? "От Я до А" : "Z to A",
  };

  return (
    <Section className={styles.wrapper}>
      <div>
        <Title>{t("page.projects.title")}</Title>
      </div>

      <div className={styles.filters_row}>
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
              const categoryName =
                cat.name?.[currentLang] ?? cat.name?.ru ?? "";
              return (
                <TabsItem key={cat.id} id={cat.slug}>
                  {categoryName}
                </TabsItem>
              );
            })}
          </Tabs>
        )}

        {/* Сортировка справа от табов, на базе общего Dropdown.
            На мобильных — на всю ширину блока */}
        <div className={styles.sort_wrapper}>
          <Dropdown
            align="right"
            fullWidth={isMobile}
            onOpenChange={setIsSortOpen}
            dropdownContent={(closeMenu) => (
              <div className={styles.sort_menu}>
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    className={`${styles.sort_option} ${sortOption === option ? styles.sort_option_active : ""}`}
                    onClick={() => {
                      setSortOption(option);
                      closeMenu();
                    }}
                    role="option"
                    aria-selected={sortOption === option}
                    type="button"
                  >
                    <Text>{sortLabels[option]}</Text>
                  </button>
                ))}
              </div>
            )}
          >
            <button
              className={`${styles.sort_button} ${isSortOpen ? styles.sort_button_open : ""}`}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
            >
              <div className={styles.title}>
                <span className={styles.text}>{sortLabels[sortOption]}</span>
                <span className={styles.icon}>
                  <span className={styles.sort_arrow} aria-hidden="true" />
                </span>
              </div>
            </button>
          </Dropdown>
        </div>
      </div>

      {/* Сетка проектов */}
      <div className={styles.projects_grid}>
        {isLoading ?
          <Text>
            {currentLang === "ru" ?
              "Загружаем проект..."
            : "Loading projects..."}
          </Text>
        : filteredProjects.length === 0 ?
          <Text>
            {currentLang === "ru" ? "Проекты не найдены" : "No projects found"}
          </Text>
        : filteredProjects.map((item) => {
            // Безопасное_extraction локализованных данных с фолбэком
            const title = item.title?.[currentLang] ?? item.title?.ru ?? "";
            const description =
              item.description?.[currentLang] ?? item.description?.ru ?? "";
            const logo =
              item.logo_url?.[currentLang] ?? item.logo_url?.ru ?? "";
            const snippet =
              item.snippet_url?.[currentLang] ?? item.snippet_url?.ru ?? "";

            const categoryName =
              item.category_info ?
                (item.category_info.name?.[currentLang] ??
                item.category_info.name?.ru ??
                "")
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
