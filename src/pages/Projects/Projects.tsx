import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../../utils";

import styles from "./Projects.module.scss";

import { ProjectCard, Section, Text, Title } from "@/components";

interface IProjects {
  id: string;
  title: string;
  description: string;
  logo: string;
  snippet: string;
  category: string;
}

export const Projects = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setProjects(data);
      if (error) console.error("Ошибка:", error.message);
      setIsLoading(false);
    };

    fetchProjects();
  }, []);

  return (
    <Section className={styles.wrapper}>
      <div>
        <Title>{t("page.projects.title")}</Title>
      </div>
      <div>
        <div>Все проекты</div>
        <div>Сайты</div>
        <div>Приложения</div>
      </div>
      <div className={styles.projects_grid}>
        {isLoading ?
          <Text>Загружаем проекты</Text>
        : projects &&
          projects.map((item) => (
            <ProjectCard
              key={item.id}
              slug={item.slug}
              logo={item.logo_url}
              snippet={item.snippet_url}
              title={item.title}
              description={item.description}
              category={item.category}
            />
          ))
        }
      </div>
    </Section>
  );
};
