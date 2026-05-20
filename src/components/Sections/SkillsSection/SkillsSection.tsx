import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../../../utils";

import styles from "./SkillsSection.module.scss";

import { Section, SkillCard, Text } from "@/components";

interface SkillsSectionProps {
  id?: string;
}

interface LocalizedField {
  ru: string;
  en?: string | null;
}

interface SkillCategory {
  id: string;
  display_order: number;
  name: LocalizedField;
  icon: LocalizedField;
  icon_color: string | null;
}

interface SkillItem {
  id: string;
  display_order: number;
  name: LocalizedField;
  skill_icon: LocalizedField;
  skill_icon_color: string | null;
  category_id: string | null;
  category: SkillCategory | null;
}

export const SkillsSection = ({ id }: SkillsSectionProps) => {
  const { t, i18n } = useTranslation();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentLang = i18n.language.startsWith("ru") ? "ru" : "en";

  useEffect(() => {
    const fetchSkills = async () => {
      const { data, error } = await supabase
        .from("skills")
        .select(
          `
          *,
          category:skills_categories (*)
        `,
        )
        .order("display_order", { ascending: true });

      if (data) setSkills(data as unknown as SkillItem[]);
      if (error) console.error("Ошибка загрузки навыков:", error.message);
      setIsLoading(false);
    };

    fetchSkills();
  }, []);

  // Группируем навыки по ID категории
  const groupedSkills = useMemo(() => {
    return skills.reduce(
      (
        acc: Record<string, { info: SkillCategory; items: SkillItem[] }>,
        skill,
      ) => {
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

  // Сортируем сами категории на основе их display_order
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
      : sortedCategories.map(({ info, items }) => {
          // Извлекаем локализованные данные категории на клиенте
          const categoryName = info.name[currentLang] || info.name.ru;
          const categoryIcon = info.icon[currentLang] || info.icon.ru;

          return (
            <div key={info.id} className={styles.category_block}>
              <div className={styles.category_header}>
                {categoryIcon && (
                  <div
                    className={styles.category_icon_wrapper}
                    style={{ color: info.icon_color || undefined }}
                    dangerouslySetInnerHTML={{ __html: categoryIcon }}
                  />
                )}
                <Text className={styles.title}>{categoryName}</Text>
              </div>

              <div className={styles.skills_grid}>
                {items.map((item) => {
                  // Извлекаем локализованные данные каждого навыка
                  const skillName = item.name[currentLang] || item.name.ru;
                  const skillIcon =
                    item.skill_icon[currentLang] || item.skill_icon.ru;

                  return (
                    <SkillCard
                      key={item.id}
                      icon={
                        skillIcon ?
                          <div
                            className={styles.skill_icon_wrapper}
                            style={{
                              color: item.skill_icon_color || undefined,
                            }}
                            dangerouslySetInnerHTML={{ __html: skillIcon }}
                          />
                        : null
                      }
                    >
                      {skillName}
                    </SkillCard>
                  );
                })}
              </div>
            </div>
          );
        })
      }
    </Section>
  );
};
