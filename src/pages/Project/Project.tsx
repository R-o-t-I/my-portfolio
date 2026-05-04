import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

import styles from "./Project.module.scss";

import { Section, Text } from "@/components";

interface IProject {
  id: string;
  title: string;
  description: string;
  logo: string;
  snippet: string;
  category: string;
}

export const Project = () => {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<IProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0); // Прокрутка вверх при открытии проекта
    const getProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error || !data) {
          navigate("/");
          return;
        }

        setProject(data);
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) getProject();
  }, [slug, navigate]);

  useEffect(() => {
    if (project?.title) {
      document.title = `${project.title} | Веб-разработчик и дизайнер – Александр Тихонович`;
    }
    return () => {
      document.title = "Веб-разработчик и дизайнер – Александр Тихонович";
    }; // Сброс при уходе со страницы
  }, [project]);

  return (
    <Section className={styles.wrapper}>
      {
        isLoading ?
          <Text>Заглушка</Text>
          // Контент показываем только когда данные есть и загрузка завершена
        : project && (
            <div className={styles.container}>
              <button className={styles.back_btn} onClick={() => navigate(-1)}>
                ← Назад
              </button>

              <header className={styles.header}>
                {project.logo && (
                  <img src={project.logo} alt="Logo" className={styles.logo} />
                )}
                <h1 className={styles.title}>{project.title}</h1>
                <span className={styles.category}>{project.category}</span>
              </header>

              <main className={styles.content}>
                {project.snippet && (
                  <img
                    src={project.snippet}
                    alt={project.title}
                    className={styles.image}
                  />
                )}
                <p className={styles.description}>{project.description}</p>
              </main>
            </div>
          )

      }
    </Section>
  );
};
