import React from "react";

import { useNavigate } from "react-router-dom";

import styles from "./NotFound.module.scss";

import { Section, Title, Text, Button } from "@/components";

import okak from "../../../assets/image/okak.png";

export const NotFound = ({}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/`);
  };

  return (
    <Section className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.info}>
          <div className={styles.middle}>
            <Title size="lg">Страница не найдена</Title>
            <Text>
              Такой страницы нет, проверьте корректно ли введена ссылка
            </Text>
          </div>
          <div>
            <Button onClick={handleClick}>На главную</Button>
          </div>
        </div>
        <div className={styles.image_wrapper}>
          <img className={styles.image} src={okak} alt="Страница не найдена" />
        </div>
      </div>
    </Section>
  );
};
