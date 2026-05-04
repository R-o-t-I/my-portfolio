import React from "react";

import { Trans, useTranslation } from "react-i18next";

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

interface AboutSectionProps {
  id?: string;
}

export const AboutSection = ({ id }: AboutSectionProps) => {
  const { t } = useTranslation();

  const info = [
    {
      title: t("section.about.info.experience"),
      content: "6",
    },
    {
      title: t("section.about.info.projects"),
      content: "50",
    },
    {
      title: t("section.about.info.coffee"),
      content: "∞",
    },
  ];

  const social = [
    {
      icon: <IconLogoTelegram />,
      href: "https://t.me/alexander_tihonovich",
      label: t("aria_label.social.telegram"),
    },
    {
      icon: <IconLogoInstagram />,
      href: "https://www.instagram.com/alexander_tihonovich",
      label: t("aria_label.social.instagram"),
    },
    {
      icon: <IconLogoThreads />,
      href: "https://www.threads.com/@alexander_tihonovich",
      label: t("aria_label.social.threads"),
    },
    {
      icon: <IconLogoVK />,
      href: "https://vk.com/alexander_tihonovich",
      label: t("aria_label.social.vk"),
    },
    {
      icon: <IconLogoGitHub />,
      href: "https://github.com/R-o-t-I",
      label: t("aria_label.social.github"),
    },
  ];

  return (
    <Section id={id} className={styles.wrapper}>
      <div className={styles.about_wrapper}>
        <Text className={styles.greeting} variant="span" size="sm">
          <span className={styles.wave}>👋</span>
          {t("section.about.greeting")}
        </Text>
        <div className={styles.middle}>
          <Title variant="span" size="lg" className={styles.name}>
            {t("section.about.first_name")}
            <br />
            <span>{t("section.about.last_name")}</span>
          </Title>
          <Text variant="p" mode="secondary">
            <Trans
              t={t}
              i18nKey="section.about.description"
              components={[
                <a
                  key="0"
                  className="underline"
                  href="https://vk.com/skyreglis"
                  target="_blank"
                  rel="noreferrer"
                >
                  SkyReglis Studio
                </a>,
              ]}
            />
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
              {t("button.view_projects")}
            </Button>
            <Button
              mode="secondary"
              stretched
              onClick={() => {
                const element = document.getElementById("contacts");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t("button.contact")}
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
          alt={t("aria_label.photo.me")}
        />
        <div className={styles.bottom_wrapper}>
          <div className={styles.status_wrapper}>
            <Text className={styles.title}>
              <span className={`${styles.status} ${styles.status_available}`} />
              {t("section.about.status.title")}
            </Text>
            <Text mode="secondary" className={styles.description}>
              {t("section.about.status.description")}
            </Text>
          </div>
          <div className={styles.social_wrapper}>
            {social.map((item, index) => (
              <React.Fragment key={index}>
                <a
                  href={item.href}
                  target="_blank"
                  className={styles.icon_wrapper}
                  aria-label={`${item.label}`}
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
