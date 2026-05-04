import React from "react";

import styles from "./ServicesSection.module.scss";

import { Section, ServiceCard } from "@/components";

import { IconCode, IconLayers, IconPen, IconPrototype } from "@/assets/icons";

const services = [
  {
    icon: <IconCode color="#3B82F6" />,
    glow_icon: "rgba(59, 130, 246, 0.05)",
    title: "Вёрстка сайтов и приложений",
    description:
      "Создаю адаптивные, быстрые и кроссбраузерные сайты с чистым и семантическим кодом.",
  },
  {
    icon: <IconPen color="#A855F7" />,
    glow_icon: "rgba(168, 85, 247, 0.05)",
    title: "Дизайн интерфейсов",
    description:
      "Разрабатываю стильные и удобные интерфейсы для веб и мобильных приложений.",
  },
  {
    icon: <IconPrototype color="#22C55E" />,
    glow_icon: "rgba(34, 197, 94, 0.05)",
    title: "UI/UX дизайн",
    description:
      "Проектирую пользовательский опыт, который решает задачи бизнеса и делает продукт удобным для людей.",
  },
  {
    icon: <IconLayers color="#F97316" />,
    glow_icon: "rgba(249, 115, 22, 0.05)",
    title: "Дизайн систем и прототипирование",
    description:
      "Создаю дизайн-системы, компоненты и интерактивные прототипы в Figma.",
  },
];

interface ServicesSectionProps {
  id?: string;
}

export const ServicesSection = ({ id }: ServicesSectionProps) => {
  return (
    <Section
      id={id}
      title="Услуги"
      subtitle="Что я делаю"
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
