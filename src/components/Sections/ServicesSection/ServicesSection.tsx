import React from "react";

import { useTranslation } from "react-i18next";

import styles from "./ServicesSection.module.scss";

import { Section, ServiceCard } from "@/components";

import { IconCode, IconLayers, IconPen, IconPrototype } from "@/assets/icons";

interface ServicesSectionProps {
  id?: string;
}

export const ServicesSection = ({ id }: ServicesSectionProps) => {
  const { t } = useTranslation();

  const services = [
    {
      icon: <IconCode color="#3B82F6" />,
      glow_icon: "rgba(59, 130, 246, 0.05)",
      title: t("section.services.card.code.title"),
      description: t("section.services.card.code.description"),
    },
    {
      icon: <IconPen color="#A855F7" />,
      glow_icon: "rgba(168, 85, 247, 0.05)",
      title: t("section.services.card.design_interface.title"),
      description: t("section.services.card.design_interface.description"),
    },
    {
      icon: <IconPrototype color="#22C55E" />,
      glow_icon: "rgba(34, 197, 94, 0.05)",
      title: t("section.services.card.ui_ux.title"),
      description: t("section.services.card.ui_ux.description"),
    },
    {
      icon: <IconLayers color="#F97316" />,
      glow_icon: "rgba(249, 115, 22, 0.05)",
      title: t("section.services.card.design_system.title"),
      description: t("section.services.card.design_system.description"),
    },
  ];

  return (
    <Section
      id={id}
      title={t("section.services.title")}
      subtitle={t("section.services.subtitle")}
      className={styles.wrapper}
    >
      <div className={styles.services_grid}>
        {services.map((item, index) => (
          <ServiceCard
            key={index}
            icon={item.icon}
            title={item.title}
            description={item.description}
            glow_icon={item.glow_icon}
          />
        ))}
      </div>
    </Section>
  );
};
