import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import styles from "./Select.module.scss";

import SelectOption from "./SelectOption";

import { Text } from "@/components";

export type SelectOptionData = { value: string; label: string };

// Строка — shorthand для { value: строка, label: та же строка }
export type SelectOptionInput = string | SelectOptionData;

type SelectProps = {
  options: SelectOptionInput[];
  // Значение выбранной опции (не подпись)
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

const normalizeOption = (option: SelectOptionInput): SelectOptionData =>
  typeof option === "string" ? { value: option, label: option } : option;

// Список примыкает к селекту вплотную: glass-поверхности читаются
// как единое целое, а стык остаётся плоским
const GAP = 0;

export const Select = ({ options, value, onChange, label }: SelectProps) => {
  const normalized = useMemo(() => options.map(normalizeOption), [options]);

  const [opened, setOpened] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [highlighted, setHighlighted] = useState(0);

  const select = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // fixed-позиционирование в координатах вьюпорта: скролл не нужен,
  // меню «едет» вместе со страницей само; пересчёт — только на resize
  const updatePosition = useCallback(() => {
    const rect = select.current?.getBoundingClientRect();
    if (!rect) return;

    const menuH = menu.current?.offsetHeight ?? 0;
    const spaceBelow = window.innerHeight - rect.bottom;

    const up = spaceBelow < menuH + GAP && rect.top > menuH + GAP;
    setDirection(up ? "up" : "down");

    setCoords({
      top: up ? rect.top - menuH - GAP : rect.bottom + GAP,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!opened) return;

    // Первый проход — по rect селекта (меню ещё не измерено),
    // второй — в следующем кадре, когда offsetHeight меню уже есть
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    // capture: true — ловим скролл и вложенных контейнеров, не только страницы
    document.addEventListener("scroll", updatePosition, {
      capture: true,
      passive: true,
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", updatePosition, { capture: true });
    };
  }, [opened, updatePosition]);

  const close = () => setOpened(false);

  useEffect(() => {
    if (!opened) return;

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          close();
          select.current?.focus();
          break;
        case "ArrowDown":
          event.preventDefault();
          setHighlighted((prev) => Math.min(prev + 1, normalized.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlighted((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (normalized[highlighted]) {
            onChange(normalized[highlighted].value);
            close();
            select.current?.focus();
          }
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [opened, highlighted, normalized, onChange]);

  const open = () => {
    const selected = normalized.findIndex((option) => option.value === value);
    setHighlighted(Math.max(0, selected));
    setOpened(true);
  };

  const selectClick = () => {
    if (opened) {
      select.current?.blur();
    } else {
      open();
    }
  };

  const selected = normalized.find((option) => option.value === value);

  // Класс направления нужен и селекту (радиусы стыка), и порталу
  const directionClass = direction === "up" ? styles.up : styles.down;

  return (
    <>
      <div
        ref={select}
        className={`${styles.wrapper} ${
          opened ? `${styles.opened} ${directionClass}` : ""
        }`}
        role="combobox"
        aria-expanded={opened}
        aria-haspopup="listbox"
        aria-label={label}
        tabIndex={0}
        onClick={selectClick}
        onBlur={close}
      >
        <Text className={styles.text}>{selected?.label ?? value}</Text>
      </div>

      {opened &&
        createPortal(
          <div
            ref={menu}
            className={`${styles.optionsList} ${directionClass}`}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              // До первого измерения coords.top === 0 — меню держим скрытым,
              // иначе один кадр виден в неправильном месте
              visibility: coords.top === 0 ? "hidden" : "visible",
            }}
            role="listbox"
          >
            {normalized.map((option, index) => (
              <SelectOption
                key={option.value}
                isActive={index === highlighted}
                onClick={() => {
                  onChange(option.value);
                  close();
                  select.current?.focus();
                }}
                // preventDefault держит фокус на селекте: blur не закроет список раньше клика
                onMouseDown={(event: MouseEvent<HTMLDivElement>) =>
                  event.preventDefault()
                }
                onMouseEnter={() => setHighlighted(index)}
              >
                {option.label}
              </SelectOption>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};
