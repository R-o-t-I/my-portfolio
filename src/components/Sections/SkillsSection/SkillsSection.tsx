import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../utils";

import styles from "./SkillsSection.module.scss";

import { Section, SkillCard, Text } from "@/components";

interface Category {
  id: string;
  name_ru: string;
  name_en?: string;
  icon?: string;
  icon_color?: string;
  display_order: number;
  [key: string]: any; // Индексатор для name_en / name_ru
}

interface Skill {
  id: string;
  name_ru: string;
  name_en?: string;
  skill_icon?: string;
  skill_icon_color?: string;
  display_order: number;
  category: Category | null; // Категория может быть null
  [key: string]: any;
}

interface SkillsSectionProps {
  id?: string;
}

export const SkillsSection = ({ id }: SkillsSectionProps) => {
  const { t, i18n } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const lang = i18n.language;
  const nameKey = `name_${lang}`;

  useEffect(() => {
    const fetchSkills = async () => {
      const { data, error } = await supabase
        .from("skills")
        .select(
          `
          *,
          category:skill_categories (*)
        `,
        )
        .order("display_order", { ascending: true });

      if (data) setSkills(data);
      if (error) console.error("Ошибка загрузки:", error.message);
      setIsLoading(false);
    };

    fetchSkills();
  }, []);

  // Группируем навыки по ID категории
  const groupedSkills = useMemo(() => {
    return skills.reduce(
      (acc: Record<string, { info: Category; items: Skill[] }>, skill) => {
        // Если категория не привязана, пропускаем (защита от null)
        if (!skill.category) return acc;

        const catId = skill.category.id;

        if (!acc[catId]) {
          acc[catId] = {
            info: skill.category,
            items: [],
          };
        }
        acc[catId].items.push(skill);
        return acc;
      },
      {},
    );
  }, [skills]);

  // Сортируем сами категории по их display_order
  const sortedCategories = useMemo(() => {
    return Object.values(groupedSkills).sort(
      (a, b) => a.info.display_order - b.info.display_order,
    );
  }, [groupedSkills]);

  return (
    <Section
      id={id}
      title={t("section.skills.title")}
      subtitle={t("section.skills.subtitle")}
      className={styles.wrapper}
    >
      {isLoading ?
        <p className={styles.loading}>{t("common.loading")}</p>
      : sortedCategories.map(({ info, items }) => (
          <div key={info.id} className={styles.category_block}>
            <div className={styles.category_header}>
              {info.icon && (
                <div
                  className={styles.category_icon_wrapper}
                  style={{ color: info.icon_color }}
                  dangerouslySetInnerHTML={{ __html: info.icon }}
                />
              )}
              <Text className={styles.title}>
                {info[nameKey] || info.name_ru}
              </Text>
            </div>

            <div className={styles.skills_grid}>
              {items.map((item) => (
                <SkillCard
                  key={item.id}
                  icon={
                    item.skill_icon ?
                      <div
                        className={styles.skill_icon_wrapper}
                        style={{ color: item.skill_icon_color }}
                        dangerouslySetInnerHTML={{ __html: item.skill_icon }}
                      />
                    : null
                  }
                >
                  {item[nameKey] || item.name_ru}
                </SkillCard>
              ))}
            </div>
          </div>
        ))
      }
    </Section>
  );
};
