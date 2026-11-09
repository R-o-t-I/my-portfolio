import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./Dropdown.module.scss";

interface DropdownProps {
  children: React.ReactNode;
  dropdownContent:
    | React.ReactNode
    | ((closeMenu: () => void) => React.ReactNode);
  className?: string;
  closeOnClick?: boolean;
  /** Выравнивание меню относительно триггера: по левому или правому краю */
  align?: "left" | "right";
  /** Растягивает меню на ширину триггера */
  fullWidth?: boolean;
  /** Сообщает наружу об изменении состояния открытия */
  onOpenChange?: (isOpen: boolean) => void;
}

export const Dropdown = ({
  children,
  dropdownContent,
  className = "",
  closeOnClick = true,
  align = "left",
  fullWidth = false,
  onOpenChange,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: undefined as number | undefined,
  });
  const [isUp, setIsUp] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const menuH = menuRef.current?.offsetHeight || 0;
    const menuW = fullWidth ? rect.width : menuRef.current?.offsetWidth || 0;

    const spaceBelow = winH - rect.bottom;
    const shouldOpenUp = spaceBelow < menuH && rect.top > menuH;
    setIsUp(shouldOpenUp);

    const spaceRight = winW - rect.left;
    const shouldShiftLeft =
      !fullWidth && (align === "right" || spaceRight < menuW);

    const top =
      shouldOpenUp ? rect.top + scrollY - menuH - 4 : rect.bottom + scrollY + 4;

    let left =
      shouldShiftLeft ? rect.right + scrollX - menuW : rect.left + scrollX;

    // Вписываем меню в границы окна, чтобы на узких экранах
    // оно не вылезало за края (с отступом 8px)
    const margin = 8;
    if (left < scrollX + margin) {
      left = scrollX + margin;
    } else if (left + menuW > scrollX + winW - margin) {
      left = scrollX + winW - margin - menuW;
    }

    setCoords({
      top,
      left,
      width: fullWidth ? rect.width : undefined,
    });
  }, [align, fullWidth]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = requestAnimationFrame(updatePosition);
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Уведомляем родителя о смене состояния открытия
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className={styles.triggerWrapper}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={`${styles.dropdownPortal} ${className || ""} ${isUp ? styles.isUp : ""}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: coords.width ? `${coords.width}px` : undefined,
              visibility: coords.top === 0 ? "hidden" : "visible",
            }}
            onClick={(e) => {
              if (closeOnClick) {
                e.stopPropagation();
                closeMenu();
              }
            }}
          >
            {typeof dropdownContent === "function" ?
              dropdownContent(closeMenu)
            : dropdownContent}
          </div>,
          document.body,
        )}
    </>
  );
};
