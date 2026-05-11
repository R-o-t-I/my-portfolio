import React from "react";

import { useTranslation } from "react-i18next";

import styles from "./Footer.module.scss";

import { Text } from "@/components/Typography";

import {
  IconCode,
  IconLogoGitHub,
  IconLogoInstagram,
  IconLogoTelegram,
  IconLogoThreads,
  IconLogoVK,
} from "@/assets/icons";

export const Footer = ({}) => {
  const { t } = useTranslation();

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
    <footer className={styles.footer}>
      <div className={styles.logo_wrapper}>
        <div className={styles.icon_wrapper}>
          <IconCode size={48} />
        </div>
        <div className={styles.middle}>
          <div className={styles.name}>
            {t("section.about.first_name")} <br />
            <span>{t("section.about.last_name")}</span>
          </div>
          <div className={styles.subname}>{t("section.about.job")}</div>
        </div>
      </div>
      <div className={styles.social_list}>
        {social.map((item, index) => (
          <a
            key={index}
            href={item.href}
            target="_blank"
            className={styles.social_item}
          >
            <div>{item.icon}</div>
            <Text>{item.label.split(" ")[0]}</Text>
          </a>
        ))}
      </div>
    </footer>
  );
};
