import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../utils";

import styles from "./ProjectsSection.module.scss";

import { Button, ProjectCard, Section } from "@/components";

interface ProjectsSectionProps {
  id?: string;
}

export const ProjectsSection = ({ id }: ProjectsSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

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
      after={
        <Button onClick={() => navigate("/projects")} mode="secondary">
          {t("section.projects.after")}
        </Button>
      }
      className={styles.wrapper}
    >
      <div className={styles.projects_grid}>
        {isLoading ?
          <p>Загружаем проекты</p>
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
