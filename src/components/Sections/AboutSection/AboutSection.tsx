import React from "react";

import styles from "./AboutSection.module.scss";

import {
  Button,
  ButtonGroup,
  Section,
  Separator,
  Text,
  Title,
} from "@/components";

import {
  IconLogoGitHub,
  IconLogoInstagram,
  IconLogoTelegram,
  IconLogoThreads,
  IconLogoVK,
} from "@/assets/icons";

import myPhoto from "../../../assets/image/me.jpg";

const info = [
  {
    title: "Лет опыта",
    content: "6",
  },
  {
    title: "Проектов",
    content: "50",
  },
  {
    title: "Выпитого кофе",
    content: "∞",
  },
];

const social = [
  {
    icon: <IconLogoTelegram />,
    href: "https://t.me/alexander_tihonovich",
    label: "Telegram",
  },
  {
    icon: <IconLogoInstagram />,
    href: "https://www.instagram.com/alexander_tihonovich",
    label: "Instagram",
  },
  {
    icon: <IconLogoThreads />,
    href: "https://www.threads.com/@alexander_tihonovich",
    label: "Threads",
  },
  {
    icon: <IconLogoVK />,
    href: "https://vk.com/alexander_tihonovich",
    label: "ВКонтакте",
  },
  {
    icon: <IconLogoGitHub />,
    href: "https://github.com/R-o-t-I",
    label: "GitHub",
  },
];

interface AboutSectionProps {
  id?: string;
}

export const AboutSection = ({ id }: AboutSectionProps) => {
  return (
    <Section id={id} className={styles.wrapper}>
      <div className={styles.about_wrapper}>
        <div className={styles.greeting}>
          <Text variant="span" size="sm">
            <span className={styles.wave}>👋</span> Привет! Я
          </Text>
        </div>
        <div className={styles.middle}>
          <Title variant="span" size="lg" className={styles.name}>
            Александр
            <br />
            <span>Тихонович</span>
          </Title>
          <Text variant="p" mode="secondary">
            Веб-разработчик, дизайнер и основатель{" "}
            <a
              className="underline"
              href="https://vk.com/skyreglis"
              target="_blank"
            >
              SkyReglis Studio
            </a>
            . Создаю современные сайты и приложения.
          </Text>
          <ButtonGroup stretched>
            <Button
              mode="primary"
              stretched
              onClick={() => {
                const element = document.getElementById("projects");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Смотреть проекты
            </Button>
            <Button
              mode="secondary"
              stretched
              onClick={() => {
                const element = document.getElementById("contacts");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Связаться со мной
            </Button>
          </ButtonGroup>
        </div>
        <div className={styles.info_wrapper}>
          {info.map((item, index) => (
            <React.Fragment key={index}>
              <div className={styles.item}>
                <Title>{item.content}+</Title>
                <Text mode="secondary" size="xs">
                  {item.title}
                </Text>
              </div>
              {index < info.length - 1 && <Separator direction="vertical" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className={styles.photo_wrapper}>
        <img
          className={styles.image}
          src={myPhoto}
          alt="Александр Тихонович — веб-разработчик и дизайнер"
        />
        <div className={styles.bottom_wrapper}>
          <div className={styles.status_wrapper}>
            <Text className={styles.title}>
              <span className={`${styles.status} ${styles.status_available}`} />
              Доступен для фриланса
            </Text>
            <Text mode="secondary" className={styles.description}>
              Открыт для новых проектов
              <br />и интересного сотрудничества
            </Text>
          </div>
          <div className={styles.social_wrapper}>
            {social.map((item, index) => (
              <React.Fragment key={index}>
                <a
                  href={item.href}
                  target="_blank"
                  className={styles.icon_wrapper}
                  aria-label={`${item.label} аккаунт`}
                >
                  {item.icon}
                </a>
                {index < social.length - 1 && (
                  <Separator direction="vertical" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};
