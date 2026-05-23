import React, { useRef, useEffect, useState } from "react";
import styles from "./Tabs.module.scss";
import { type TabsItemProps } from "./TabsItem/TabsItem";

interface TabsProps {
  selectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  mode?: "default" | "secondary" | "accent";
  layoutFillMode?: "auto" | "stretched" | "shrinked";
  withScrollToSelectedTab?: boolean;
  getRootRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({
  selectedId,
  onSelectedIdChange,
  mode = "accent",
  layoutFillMode = "auto",
  withScrollToSelectedTab = true,
  getRootRef,
  children,
  className = "",
}: TabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = getRootRef || containerRef;

  // Храним стили для плавающего индикатора
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

  // Храним координату предыдущего активного таба для расчета направления и деформации
  const prevLeftRef = useRef<number | null>(null);
  // Таймер для сброса эффекта растяжения
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setIndicatorStyle({ opacity: 0 });
      prevLeftRef.current = null;
      return;
    }

    const currentContainer = (activeRef as React.RefObject<HTMLDivElement>)
      .current;
    if (!currentContainer) return;

    const activeTab = currentContainer.querySelector(
      `#${selectedId}`,
    ) as HTMLElement;

    if (activeTab) {
      const currentLeft = activeTab.offsetLeft;
      const prevLeft = prevLeftRef.current;

      let skewClass = "";
      let transformOrigin = "50% 50%";

      // Если это не первая инициализация, рассчитываем деформацию
      if (prevLeft !== null && prevLeft !== currentLeft) {
        const distance = Math.abs(currentLeft - prevLeft);
        // Динамический коэффициент растяжения от расстояния (макс 1.35)
        const scaleX = Math.min(1 + distance / 600, 1.35);

        // Определяем направление движения для сдвига точки трансформации
        if (currentLeft > prevLeft) {
          // Движение вправо: растягиваемся от левого края
          transformOrigin = "left center";
          setIndicatorStyle({
            width: `${activeTab.offsetWidth}px`,
            height: `${activeTab.offsetHeight}px`,
            transform: `translateX(${currentLeft}px) scaleX(${scaleX})`,
            transformOrigin,
            opacity: 1,
          });
        } else {
          // Движение влево: растягиваемся от правого края
          transformOrigin = "right center";
          // Компенсируем сдвиг scaleX для правильного визуала влево
          setIndicatorStyle({
            width: `${activeTab.offsetWidth}px`,
            height: `${activeTab.offsetHeight}px`,
            transform: `translateX(${currentLeft}px) scaleX(${scaleX})`,
            transformOrigin,
            opacity: 1,
          });
        }

        // Через 200мс (время окончания анимации переезда) возвращаем масштаб в 1.0
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIndicatorStyle({
            width: `${activeTab.offsetWidth}px`,
            height: `${activeTab.offsetHeight}px`,
            transform: `translateX(${currentLeft}px) scaleX(1)`,
            transformOrigin: "50% 50%",
            opacity: 1,
          });
        }, 180); // Чуть быстрее, чем CSS transition для упругости
      } else {
        // Базовое состояние при первой загрузке страницы
        setIndicatorStyle({
          width: `${activeTab.offsetWidth}px`,
          height: `${activeTab.offsetHeight}px`,
          transform: `translateX(${currentLeft}px) scaleX(1)`,
          transformOrigin: "50% 50%",
          opacity: 1,
        });
      }

      // Запоминаем текущую позицию для следующего шага
      prevLeftRef.current = currentLeft;

      if (withScrollToSelectedTab) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [selectedId, withScrollToSelectedTab, children, activeRef]);

  return (
    <div
      ref={activeRef}
      className={`
        ${styles.tabs_container}
        ${styles[`fill_${layoutFillMode}`]}
        ${className}
      `.trim()}
      role="tablist"
    >
      <span className={styles.indicator} style={indicatorStyle} />

      {React.Children.map(children, (child) => {
        if (!React.isValidElement<TabsItemProps>(child)) return null;
        const anyChild = child as any;
        return React.cloneElement(anyChild, {
          selected: child.props.id === selectedId,
          className:
            `${styles.inherited_item} ${child.props.className || ""}`.trim(),
          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (child.props.onClick) child.props.onClick(e);
            if (onSelectedIdChange && child.props.id) {
              onSelectedIdChange(child.props.id);
            }
          },
          "data-mode": mode,
        });
      })}
    </div>
  );
};
