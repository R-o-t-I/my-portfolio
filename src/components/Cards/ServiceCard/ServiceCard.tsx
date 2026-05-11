import React, { useRef } from "react";

import { useSound } from "@/hooks";

import styles from "./ServiceCard.module.scss";

import { Text } from "@/components";

import clickSoundPath from "../../../assets/sounds/click.mp3";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  glow_icon?: React.ReactNode;
}

export const ServiceCard = ({
  title,
  description,
  icon,
  glow_icon,
}: ServiceCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const playClickSound = useSound(clickSoundPath);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Расчет наклона (Tilt)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10; // Макс наклон 10 градусов
    const rotateY = ((x - centerX) / centerX) * 10;

    // Установка переменных в CSS
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    cardRef.current.style.setProperty("--rotate-x", `${rotateX}deg`);
    cardRef.current.style.setProperty("--rotate-y", `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    // Сброс наклона
    cardRef.current.style.setProperty("--rotate-x", "0deg");
    cardRef.current.style.setProperty("--rotate-y", "0deg");
  };

  return (
    <div
      ref={cardRef}
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={playClickSound}
    >
      {/* Слой для радиального блика внутри */}
      <div className={styles.glow} />

      <div className={styles.content}>
        <div
          style={
            {
              "--bg-glow": glow_icon,
            } as React.CSSProperties
          }
          className={`${styles.icon_box}`}
        >
          {icon}
        </div>
        <div className={styles.middle}>
          <Text size="lg" className={styles.title}>
            {title}
          </Text>
          <Text mode="secondary" className={styles.description}>
            {description}
          </Text>
        </div>
      </div>
    </div>
  );
};
