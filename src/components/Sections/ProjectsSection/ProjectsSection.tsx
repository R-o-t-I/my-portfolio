import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { supabase } from "../../../utils/supabase";

import styles from "./ProjectsSection.module.scss";

import { ProjectCard, Section } from "@/components";

interface ProjectsSectionProps {
  id?: string;
}

export const ProjectsSection = ({ id }: ProjectsSectionProps) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (data) setProjects(data);
      if (error) console.error("Ошибка:", error.message);
      setIsLoading(false);
    };

    fetchProjects();
  }, []);

  return (
    <Section
      id={id}
      title={t("section.projects.title")}
      subtitle={t("section.projects.subtitle")}
      after={t("section.projects.after")}
      className={styles.wrapper}
    >
      <div className={styles.projects_grid}>
        {isLoading ?
          <p>Загрузка...</p>
        : projects.map((item) => (
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
