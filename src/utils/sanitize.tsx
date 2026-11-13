import DOMPurify from "dompurify";

// Белый список: только контуры SVG-иконок. Всё остальное —
// script, iframe, img, a, обработчики on* — вырезается.
// Без as const: тип Config у DOMPurify ожидает изменяемые string[]
const ICON_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "svg",
    "path",
    "g",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
    "defs",
    "use",
    "title",
  ],
  ALLOWED_ATTR: [
    // Структура SVG
    "xmlns",
    "viewBox",
    "d",
    "width",
    "height",
    "x",
    "y",
    "x1",
    "x2",
    "y1",
    "y2",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "points",
    "transform",
    // Оформление
    "fill",
    "fill-rule",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-opacity",
    "stroke-dasharray",
    "opacity",
    "style",
    // Прочее
    "class",
    "aria-hidden",
  ],
  KEEP_CONTENT: false,
};

/**
 * Пропускает через DOMPurify строку с SVG-иконкой из базы.
 * Разрешено только подмножество разметки SVG — всё остальное вырезается.
 * Возвращает пустую строку, если после очистки не осталось контента.
 */
export const sanitizeIcon = (html: string): string => {
  if (!html) return "";

  const clean = DOMPurify.sanitize(html, ICON_SANITIZE_CONFIG);

  // Иконка без svg внутри — мусор, лучше не рендерить вовсе
  return /<svg/i.test(clean) ? clean : "";
};
