import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../../utils";
import styles from "./Project.module.scss";

import {
  Button,
  ButtonGroup,
  Gallery,
  Section,
  SkillCard,
  Tabs,
  TabsItem,
  Text,
  Title,
} from "@/components";

import {
  IconGlobe,
  IconLogoGitHub,
  IconLogoOK,
  IconLogoTelegram,
  IconLogoVK,
} from "@/assets/icons";

interface LocalizedField {
  ru?: string | null;
  en?: string | null;
}

interface ProjectCategory {
  id: string;
  slug: string;
  name: LocalizedField;
  icon: LocalizedField;
}

interface ProjectSkillItem {
  skill: {
    id: string;
    name: LocalizedField;
    skill_icon: LocalizedField;
    skill_icon_color: string | null;
  };
}

export type LinkType = "website" | "telegram" | "vk" | "ok" | "github";

const LINK_CONFIG: Record<
  LinkType,
  {
    icon: React.ReactNode;
    defaultText: { ru: string; en: string };
  }
> = {
  website: {
    icon: <IconGlobe />,
    defaultText: { ru: "Перейти на сайт", en: "Visit Website" },
  },
  telegram: {
    icon: <IconLogoTelegram size={18} />,
    defaultText: { ru: "Telegram", en: "Telegram" },
  },
  vk: {
    icon: <IconLogoVK size={18} />,
    defaultText: { ru: "ВКонтакте", en: "VKontakte" },
  },
  ok: {
    icon: <IconLogoOK size={18} />,
    defaultText: { ru: "Одноклассники", en: "Odnoklassniki" },
  },
  github: {
    icon: <IconLogoGitHub size={18} />,
    defaultText: { ru: "GitHub", en: "GitHub" },
  },
};

export interface ProjectLink {
  url: string;
  type: LinkType;
  text: LocalizedField;
}

export interface GalleryCategoryFromDb {
  id: string;
  name: LocalizedField;
}

export interface GalleryItem {
  url: string;
  category: GalleryCategoryFromDb;
  title: LocalizedField;
}

interface ProjectItem {
  id: string;
  slug: string;
  created_at: string;
  category_id: string | null;
  title: LocalizedField;
  description: LocalizedField;
  description_mini: LocalizedField;
  role: LocalizedField;
  history: LocalizedField;
  logo_url: LocalizedField;
  snippet_url: LocalizedField;
  category: ProjectCategory | null;
  project_skills: ProjectSkillItem[];
  links: ProjectLink[] | null;
  gallery: GalleryItem[] | null;
}

export const Project = () => {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const currentLang = i18n.language.startsWith("ru") ? "ru" : "en";

  useEffect(() => {
    window.scrollTo(0, 0);

    const getProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select(
            `
              *,
              category:projects_categories (*),
              project_skills (
                skill:skills (
                  id,
                  name,
                  skill_icon,
                  skill_icon_color
                )
              )
            `,
          )
          .eq("slug", slug)
          .single();

        if (error || !data) {
          navigate("/");
          return;
        }

        setProject(data as unknown as ProjectItem);
        setActiveCategory("all");
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) getProject();
  }, [slug, navigate]);

  const projectDetails = useMemo(() => {
    if (!project) return null;

    // 1. Мапим стек технологий, очищая вложенную структуру от Supabase
    const techStack =
      project.project_skills
        ?.map((item) => {
          if (!item?.skill) return null;
          const name =
            item.skill.name?.[currentLang] ?? item.skill.name?.ru ?? "";
          const icon =
            item.skill.skill_icon?.[currentLang] ??
            item.skill.skill_icon?.ru ??
            "";
          return {
            id: item.skill.id,
            name,
            icon,
            color: item.skill.skill_icon_color,
          };
        })
        // ИСПРАВЛЕНО: Вместо .filter(Boolean) используем Type Guard предикат,
        // который на уровне типов гарантирует TS, что null элементов внутри больше нет
        .filter((item): item is NonNullable<typeof item> => item !== null) ||
      [];

    const links = (project.links ?? [])
      .map((link) => {
        if (!link?.type) return null;
        const config = LINK_CONFIG[link.type];
        if (!config) return null;

        const textFromDb = link.text?.[currentLang] ?? link.text?.ru ?? null;
        const finalText = textFromDb ?? config.defaultText[currentLang];

        return {
          url: link.url ?? "",
          text: finalText,
          icon: config.icon,
        };
      })
      .filter(Boolean);

    const rawGallery = project.gallery ?? [];
    const gallery = rawGallery.map((item) => ({
      url: item.url ?? "",
      categoryId: item.category?.id ?? "other",
      title: item.title?.[currentLang] ?? item.title?.ru ?? "",
    }));

    const uniqueCategoriesMap = new Map<string, string>();
    rawGallery.forEach((item) => {
      if (item.category?.id) {
        const localizedName =
          item.category.name?.[currentLang] ??
          item.category.name?.ru ??
          "Other";
        uniqueCategoriesMap.set(item.category.id, localizedName);
      }
    });
    const categories = Array.from(uniqueCategoriesMap.entries()).map(
      ([id, name]) => ({ id, name }),
    );

    const formattedDate =
      project.created_at ?
        (() => {
          try {
            return new Date(project.created_at).toLocaleDateString(
              currentLang === "ru" ? "ru-RU" : "en-US",
              { day: "numeric", month: "long", year: "numeric" },
            );
          } catch {
            return null;
          }
        })()
      : null;

    return {
      title: project.title?.[currentLang] ?? project.title?.ru ?? "",
      description:
        project.description?.[currentLang] ?? project.description?.ru ?? "",
      description_mini:
        project.description_mini?.[currentLang] ??
        project.description_mini?.ru ??
        "",
      history: project.history?.[currentLang] ?? project.history?.ru ?? "",
      created: formattedDate,
      role: project.role?.[currentLang] ?? project.role?.ru ?? "",
      logo: project.logo_url?.[currentLang] ?? project.logo_url?.ru ?? "",
      snippet:
        project.snippet_url?.[currentLang] ?? project.snippet_url?.ru ?? "",
      categoryName:
        project.category?.name?.[currentLang] ??
        project.category?.name?.ru ??
        "",
      techStack,
      links,
      gallery,
      categories,
    };
  }, [project, currentLang]);

  // УПРАВЛЕНИЕ ЗАГОЛОВКОМ ВКЛАДКИ (СИНХРОНИЗИРОВАНО С APP.TSX)
  // УПРАВЛЕНИЕ ЗАГОЛОВКОМ И МЕТА-ТЕГАМИ ПРОЕКТА
  useEffect(() => {
    if (projectDetails?.title) {
      const baseTitle =
        currentLang === "ru" ?
          "Веб-разработчик и дизайнер – Александр Тихонович"
        : "Web Developer & Designer – Alexander Tikhonovich";

      // 1. Меняем название вкладки браузера
      document.title = `${projectDetails.title} | ${baseTitle}`;

      // 2. ДОБАВЛЕНО: Меняем описание и ключевые слова под конкретный кейс проекта
      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      if (metaDescription && projectDetails.description_mini) {
        metaDescription.setAttribute(
          "content",
          projectDetails.description_mini,
        );
      }

      // Генерируем ключевые слова на базе стека технологий проекта
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords && projectDetails.techStack) {
        const stackNames = projectDetails.techStack
          .map((t) => t.name)
          .join(", ");
        metaKeywords.setAttribute(
          "content",
          `${projectDetails.title}, ${stackNames}, SkyReglis`,
        );
      }

      // 3. ДОБАВЛЕНО: Подменяем превью-картинки на сниппет или логотип проекта из Supabase
      if (projectDetails.snippet) {
        document
          .querySelector('meta[property="og:image"]')
          ?.setAttribute("content", projectDetails.snippet);
        document
          .querySelector('meta[name="twitter:image"]')
          ?.setAttribute("content", projectDetails.snippet);
      }

      // Подменяем заголовки для превью мессенджеров
      document
        .querySelector('meta[property="og:title"]')
        ?.setAttribute("content", projectDetails.title);
      document
        .querySelector('meta[name="twitter:title"]')
        ?.setAttribute("content", projectDetails.title);
    }

    // При размонтировании компонента (уходе со страницы) сбрасываем всё обратно в дефолт
    return () => {
      document.title = "Веб-разработчик и дизайнер – Александр Тихонович";
      document
        .querySelector('meta[property="og:image"]')
        ?.setAttribute("content", "https://vercel.app");
      document
        .querySelector('meta[name="twitter:image"]')
        ?.setAttribute("content", "https://vercel.app");
    };
  }, [projectDetails, currentLang]);

  return (
    <Section className={styles.wrapper}>
      {isLoading ?
        <Text>
          {currentLang === "ru" ?
            "Загружаем проект..."
          : "Loading the project..."}
        </Text>
      : projectDetails && (
          <div className={styles.container}>
            <Button
              mode="secondary"
              className={styles.back_btn}
              onClick={() => navigate(-1)}
            >
              {currentLang === "ru" ? "← Назад" : "← Back"}
            </Button>

            <div className={styles.header}>
              <div className={styles.info}>
                {projectDetails.categoryName && (
                  <Text size="sm" className={styles.category}>
                    {projectDetails.categoryName}
                  </Text>
                )}
                <div className={styles.middle}>
                  <Title className={styles.title}>{projectDetails.title}</Title>
                  {projectDetails.description_mini && (
                    <Text align="justify" className={styles.description_mini}>
                      {projectDetails.description_mini}
                    </Text>
                  )}
                  {projectDetails.created && (
                    <Text size="sm">
                      {currentLang === "ru" ? "Вышел: " : "Released: "}
                      {projectDetails.created}
                    </Text>
                  )}
                  {projectDetails.role && (
                    <Text size="sm">
                      {currentLang === "ru" ? "Моя роль: " : "My role: "}
                      {projectDetails.role}
                    </Text>
                  )}
                </div>
                {projectDetails.links && (
                  <ButtonGroup className={styles.links_container}>
                    {projectDetails.links.map((link, index) => (
                      <Button
                        before={link?.icon}
                        key={index}
                        href={link?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.project_link}
                      >
                        <span>{link?.text}</span>
                      </Button>
                    ))}
                  </ButtonGroup>
                )}
              </div>
              {projectDetails.logo && (
                <div className={styles.logo_wrapper}>
                  <img
                    src={projectDetails.logo}
                    alt={projectDetails.title}
                    className={styles.logo}
                  />
                </div>
              )}
            </div>

            <div className={styles.content}>
              {projectDetails.description && (
                <div className={styles.content_item}>
                  <Title size="sm">
                    {currentLang === "ru" ? "О проекте" : "About the project"}
                  </Title>
                  <Text align="justify">{projectDetails.description}</Text>
                </div>
              )}

              {(project?.project_skills?.length ?? 0) > 0 && (
                <div className={styles.content_item}>
                  <Title size="sm">
                    {currentLang === "ru" ?
                      "Используемые технологии"
                    : "Tech Stack"}
                  </Title>
                  <div className={styles.tech_list}>
                    {projectDetails.techStack.map((tech: any) => (
                      <div key={tech.id} className={styles.tech_item}>
                        <SkillCard
                          icon={
                            (
                              tech.icon &&
                              typeof tech.icon === "string" &&
                              tech.icon.trim() !== ""
                            ) ?
                              <div
                                className={styles.tech_icon_wrapper}
                                style={{ color: tech.color || undefined }}
                                dangerouslySetInnerHTML={{ __html: tech.icon }}
                              />
                            : undefined
                          }
                        >
                          {tech.name}
                        </SkillCard>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {projectDetails.history && (
                <div className={styles.content_item}>
                  <Title size="sm">История проекта</Title>
                  <Text align="justify">{projectDetails.history}</Text>
                </div>
              )}

              {projectDetails.gallery?.length > 0 && (
                <div className={styles.content_item}>
                  <Title size="sm">
                    {currentLang === "ru" ? "Галерея" : "Gallery"}
                  </Title>

                  {projectDetails.categories.length > 1 && (
                    <Tabs
                      selectedId={activeCategory}
                      onSelectedIdChange={(id) => setActiveCategory(id)}
                      layoutFillMode="auto"
                      withScrollToSelectedTab
                    >
                      <TabsItem id="all">
                        {currentLang === "ru" ? "Все" : "All"}
                      </TabsItem>

                      {projectDetails.categories.map((cat) => (
                        <TabsItem key={cat.id} id={cat.id}>
                          {cat.name}
                        </TabsItem>
                      ))}
                    </Tabs>
                  )}

                  <Gallery
                    images={projectDetails.gallery.filter(
                      (img) =>
                        activeCategory === "all" ||
                        img.categoryId === activeCategory,
                    )}
                    activeCategory={activeCategory}
                  />
                </div>
              )}
            </div>
          </div>
        )
      }
    </Section>
  );
};
