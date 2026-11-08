import React, { useState, useRef, useEffect } from "react";
import styles from "./Gallery.module.scss";

export interface GalleryImage {
  url: string;
  categoryId: string;
  title: string;
}

interface GalleryProps {
  images: GalleryImage[];
  activeCategory: string;
}

export const Gallery = ({ images, activeCategory }: GalleryProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [isInterfaceVisible, setIsInterfaceVisible] = useState(true);

  const touchStartX = useRef<number | null>(null);

  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const isOverflowing = scrollWidth > clientWidth;

      setCanScrollLeft(isOverflowing && scrollLeft > 2);
      setCanScrollRight(
        isOverflowing && scrollLeft + clientWidth < scrollWidth - 2,
      );
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollLeft = 0;
    updateScrollState();

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    resizeObserver.observe(container);
    Array.from(container.children).forEach((child) =>
      resizeObserver.observe(child),
    );

    return () => {
      resizeObserver.disconnect();
    };
  }, [images, activeCategory]);

  useEffect(() => {
    if (fullscreenIndex !== null) {
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setFullscreenIndex(null);
        if (e.key === "ArrowRight") handleFullscreenNavigate("next");
        if (e.key === "ArrowLeft") handleFullscreenNavigate("prev");
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [fullscreenIndex, images.length]);

  useEffect(() => {
    if (fullscreenIndex === null) {
      setIsInterfaceVisible(true);
    }
  }, [fullscreenIndex]);

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

  const handleFullscreenNavigate = (direction: "next" | "prev") => {
    if (fullscreenIndex === null) return;

    setIsInterfaceVisible(true);

    if (direction === "next") {
      setFullscreenIndex((prev) =>
        prev !== null && prev + 1 < images.length ? prev + 1 : 0,
      );
    } else {
      setFullscreenIndex((prev) =>
        prev !== null && prev - 1 >= 0 ? prev - 1 : images.length - 1,
      );
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const difference = touchStartX.current - touchEndX;
    const swipeThreshold = 50;

    if (Math.abs(difference) > swipeThreshold) {
      if (difference > 0) {
        handleFullscreenNavigate("next");
      } else {
        handleFullscreenNavigate("prev");
      }
    }

    touchStartX.current = null;
  };

  if (images.length === 0) return null;

  return (
    <div key={activeCategory} className={styles.gallery_wrapper}>
      <button
        className={`${styles.arrow_btn} ${styles.arrow_left} ${!canScrollLeft ? styles.btn_disabled : ""}`}
        onClick={() => handleScroll("left")}
        type="button"
      >
        ←
      </button>

      <div
        ref={scrollContainerRef}
        className={styles.gallery_container}
        onScroll={updateScrollState}
      >
        {images.map((img, index) => (
          <div
            key={index}
            className={styles.gallery_item}
            onClick={() => setFullscreenIndex(index)}
            style={{ cursor: "zoom-in" }}
          >
            <img
              src={img.url}
              alt={img.title}
              loading="lazy"
              onLoad={updateScrollState}
            />
          </div>
        ))}
      </div>

      <button
        className={`${styles.arrow_btn} ${styles.arrow_right} ${!canScrollRight ? styles.btn_disabled : ""}`}
        onClick={() => handleScroll("right")}
        type="button"
      >
        →
      </button>

      {fullscreenIndex !== null && (
        <div
          className={`${styles.fullscreen_overlay} ${!isInterfaceVisible ? styles.ui_hidden : ""}`}
          onClick={() => setFullscreenIndex(null)} // Клик по фону (включая бока) теперь закрывает оверлей
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={
            {
              "--ui-opacity": isInterfaceVisible ? "1" : "0",
              "--ui-pointer-events": isInterfaceVisible ? "auto" : "none",
            } as React.CSSProperties
          }
        >
          <div
            className={`${styles.fullscreen_counter} ${!isInterfaceVisible ? styles.ui_hidden : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenIndex + 1} / {images.length}
          </div>

          <button
            className={styles.close_btn}
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenIndex(null);
            }}
            type="button"
            aria-label="Закрыть галерею"
          >
            <span />
            <span />
          </button>

          <button
            className={`${styles.lightbox_arrow} ${styles.lightbox_left} ${images.length <= 1 ? styles.hides_controls : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreenNavigate("prev");
            }}
            type="button"
            aria-label="Предыдущее фото"
          >
            <span />
          </button>

          <div
            className={`${styles.fullscreen_content} ${!isInterfaceVisible ? styles.fullscreen_mode : ""}`}
            onClick={(e) => e.stopPropagation()} // ИСПРАВЛЕНО: Клик по пустой зоне внутри контента больше не закрывает и не скрывает UI
          >
            <img
              src={images[fullscreenIndex].url}
              alt={images[fullscreenIndex].title}
              onClick={(e) => {
                e.stopPropagation();
                setIsInterfaceVisible((prev) => !prev); // ИСПРАВЛЕНО: Только клик по САМОЙ картинке переключает интерфейс
              }}
              style={{ cursor: "pointer" }}
            />

            {images[fullscreenIndex].title && (
              <div
                className={styles.fullscreen_caption}
                onClick={(e) => e.stopPropagation()} // ИСПРАВЛЕНО: Клик по тексту подписи полностью изолирован
              >
                {images[fullscreenIndex].title}
              </div>
            )}
          </div>

          <button
            className={`${styles.lightbox_arrow} ${styles.lightbox_right} ${images.length <= 1 ? styles.hides_controls : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreenNavigate("next");
            }}
            type="button"
            aria-label="Следующее фото"
          >
            <span />
          </button>
        </div>
      )}
    </div>
  );
};
