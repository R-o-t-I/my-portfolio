import React, { useState, useRef, useEffect } from "react";

import styles from "./Gallery.module.scss";

import { Text } from "@/components";

export interface GalleryImage {
  url: string;
  categoryId: string;
  title: string;
}

interface GalleryProps {
  images: GalleryImage[];
  activeCategory: string; // Передаем, чтобы сбрасывать скролл при смене таба
}

export const Gallery = ({ images, activeCategory }: GalleryProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Проверяем возможность прокрутки в обе стороны
  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;

      // Можно скроллить влево, если отступили от начала больше чем на 1px (защита от дробных пикселей)
      setCanScrollLeft(scrollLeft > 1);

      // Можно скроллить вправо, если не дошли до конца (с запасом в 1px на округление)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  // Проверяем состояние при изменении картинок, категории или размеров экрана
  useEffect(() => {
    const timer = setTimeout(updateScrollState, 100);
    window.addEventListener("resize", updateScrollState);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [images, activeCategory]);

  // Управление скроллом через кнопки-стрелки
  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.6;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (images.length === 0) return null;

  return (
    <div className={styles.gallery_wrapper}>
      {/* Левая стрелка рендерится только если есть куда скроллить влево */}
      {canScrollLeft && (
        <button
          className={`${styles.arrow_btn} ${styles.arrow_left}`}
          onClick={() => handleScroll("left")}
        >
          ←
        </button>
      )}

      {/* Навешиваем onScroll для отслеживания ручной прокрутки или прокрутки пальцем */}
      <div
        key={activeCategory}
        ref={scrollContainerRef}
        className={styles.gallery_container}
        onScroll={updateScrollState}
      >
        {images.map((img, index) => (
          <div key={index} className={styles.gallery_item}>
            <div className={styles.image_wrapper}>
              <img src={img.url} alt={img.title} loading="lazy" />
            </div>
            {/* {img.title && (
              <div className={styles.title_wrapper}>
                <div className={styles.image_title}>{img.title}</div>
              </div>
            )} */}
          </div>
        ))}
      </div>

      {/* Правая стрелка рендерится только если есть куда скроллить вправо */}
      {canScrollRight && (
        <button
          className={`${styles.arrow_btn} ${styles.arrow_right}`}
          onClick={() => handleScroll("right")}
        >
          →
        </button>
      )}
    </div>
  );
};
