import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./SkillsSection.module.scss";

import { supabase } from "../../../utils/supabase";

import { Section } from "@/components";

import * as Icons from "../../../assets/icons";

interface Skill {
  id: string;
  name: string;
  color: string;
}

interface SkillsSectionProps {
  id?: string;
}

export const SkillsSection = ({ id }: SkillsSectionProps) => {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const SKILL_ICONS_MAP: Record<string, React.FC<any>> = {
    HTML: Icons.IconLogoHtml,
    CSS: Icons.IconLogoCss,
    JavaScript: Icons.IconLogoJs,
    TypeScript: Icons.IconLogoTs,
    React: Icons.IconLogoReact,
    "Next.js": Icons.IconLogoNextjs,
    Figma: Icons.IconLogoFigma,
  };

  useEffect(() => {
    const fetchSkills = async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("display_order", { ascending: true });

      if (data) setSkills(data);
      if (error) console.error("Ошибка при загрузке навыков:", error.message);
      setIsLoading(false);
    };

    fetchSkills();
  }, []);

  return (
    <Section
      id={id}
      title={t("section.skills.title")}
      subtitle={t("section.skills.subtitle")}
      className={styles.wrapper}
    >
      <div className={styles.skills_grid}>
        {isLoading ?
          <p className={styles.loading}>{t("common.loading")}</p>
        : skills.map((skill) => {
            const IconComponent = SKILL_ICONS_MAP[skill.name];

            return (
              <div key={skill.id} className={styles.skill_card}>
                <div className={styles.icon_box}>
                  {IconComponent && (
                    <IconComponent color={skill.color} size={28} />
                  )}
                </div>
                <span className={styles.name}>{skill.name}</span>
              </div>
            );
          })
        }
      </div>
    </Section>
  );
};
