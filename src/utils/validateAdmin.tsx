import { type TFunction } from "i18next";

import { supabase } from "./supabase"; // поправь путь, если клиент лежит в другом файле

// ─── Типы ───────────────────────────────────────────────────────────────

export interface AdminProjectFormData {
  slug: string;
  // место для остальных полей формы проекта по мере роста админки
}

export interface AdminProjectFormErrors {
  slug?: string;
  file?: string;
}

// ─── Правила (латиница обязательна: пути в Storage строятся из слага) ──

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;
export const CYRILLIC_PATTERN = /[а-яё]/i;

const SLUG_MAX_LENGTH = 64;

export const FILE_MAX_SIZE_MB = 5;

export const FILE_MAX_SIZE_BYTES = FILE_MAX_SIZE_MB * 1024 * 1024;

// Гибрид: as const внутри ловит опечатки при компиляции,
// ReadonlySet снаружи принимает любой string в .has()
const FILE_ALLOWED_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const);

// Для атрибута accept инпута
export const FILE_ACCEPT_ATTR = "image/png,image/jpeg,image/webp,image/svg+xml";

// Запасная подпапка для изображений галереи без категории
export const GALLERY_FALLBACK_CATEGORY = "other";

// ─── Слаг: живая проверка (пустое поле не считается ошибкой) ───────────

export const getSlugError = (raw: string, t: TFunction): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (CYRILLIC_PATTERN.test(trimmed)) {
    return t(
      "admin.error.slug_cyrillic",
      "В слаге не может быть кириллицы — используйте латиницу, цифры, дефис",
    );
  }
  if (!SLUG_PATTERN.test(trimmed)) {
    return t(
      "admin.error.slug_invalid",
      "Слаг должен содержать только латинские буквы, цифры, дефис и подчёркивание",
    );
  }
  return null;
};

// ─── Файл: проверка после выбора ────────────────────────────────────────

export const getFileError = (file: File, t: TFunction): string | null => {
  if (!FILE_ALLOWED_TYPES.has(file.type)) {
    return t("admin.error.file_type", "Поддерживаются PNG, JPEG, WebP и SVG");
  }
  if (file.size > FILE_MAX_SIZE_BYTES) {
    return t("admin.error.file_size", {
      defaultValue: `Файл больше ${FILE_MAX_SIZE_MB} МБ — выберите поменьше`,
      maxMb: FILE_MAX_SIZE_MB,
    });
  }
  return null;
};

// ─── Валидация формы перед отправкой ───────────────────────────────────

export const validateAdminProjectForm = (
  data: AdminProjectFormData,
  t: TFunction,
): AdminProjectFormErrors => {
  const errors: AdminProjectFormErrors = {};

  // Слаг: перед отправкой пустое поле — уже ошибка (в отличие от живой проверки)
  const slugTrimmed = data.slug.trim();
  if (!slugTrimmed) {
    errors.slug = t("admin.error.slug_required", "Укажите слаг проекта");
  } else {
    const slugError = getSlugError(slugTrimmed, t);
    if (slugError) errors.slug = slugError;
  }

  return errors;
};

// ─── Санитайзеры для пути в Storage (после валидации) ──────────────────

// Слаг: нижний регистр обязателен (имена папок проектов нормализуем)
export const sanitizeSlug = (raw: string): string => {
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);

  if (!clean || clean === "." || clean === ".." || !SLUG_PATTERN.test(clean)) {
    // сюда попадём только при обходе валидатора — консистентный текст не критичен
    throw new Error("Invalid slug");
  }
  return clean;
};

// Сегмент пути: разрешённые символы, но регистр сохраняется —
// чтобы "Screenshots" совпадал со старыми путями в Storage
export const sanitizePathSegment = (raw: string): string => {
  const clean = raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);

  if (!clean || clean === "." || clean === "..") {
    throw new Error("Invalid path segment");
  }
  return clean;
};

export const sanitizeFileName = (name: string): string => {
  const dotIndex = name.lastIndexOf(".");
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  return sanitizeSlug(base);
};

// ─── Единая развёртка неизвестных ошибок ────────────────────────────────

export const getErrorMessage = (e: unknown, fallback: string): string =>
  e instanceof Error && e.message ? e.message : fallback;

// ─── Перемещение файлов в Storage ───────────────────────────────────────
// Смена слага: файлы переезжают из старой папки проекта в новую.
// Смена категории галереи: файл переезжает в новую подпапку.

export const STORAGE_BUCKET = "portfolio"; // сверь с именем своего бакета

const STORAGE_URL_MARKERS = [
  "/storage/v1/object/public/",
  "/storage/v1/object/sign/",
] as const;

/** Извлекает путь объекта внутри бакета из публичной или подписанной ссылки. */
export const extractStoragePath = (
  url: string,
  bucket: string,
): string | null => {
  try {
    const parsed = new URL(url);
    for (const marker of STORAGE_URL_MARKERS) {
      const markerIndex = parsed.pathname.indexOf(marker);
      if (markerIndex === -1) continue;
      const after = parsed.pathname.slice(markerIndex + marker.length);
      const prefix = `${bucket}/`;
      return after.startsWith(prefix) ? after.slice(prefix.length) : null;
    }
    return null;
  } catch {
    return null;
  }
};

export interface StorageMove {
  url: string; // исходный URL файла
  fromFolder: string; // текущая папка (префикс пути)
  toFolder: string; // новая папка
}

export interface StorageMoveResult {
  fromPath: string;
  toPath: string;
}

/**
 * Перемещает файлы внутри бакета: copy + remove, возвращает карту
 * «старый URL → новый». Ссылки, не распознанные как ссылки этого бакета
 * (например, сторонние), пропускает без изменений.
 */
export const moveStorageFiles = async (
  moves: StorageMove[],
): Promise<{ urlMap: Map<string, string>; applied: StorageMoveResult[] }> => {
  const urlMap = new Map<string, string>();
  const applied: StorageMoveResult[] = [];

  for (const { url, fromFolder, toFolder } of moves) {
    const source = url.trim();
    if (!source || urlMap.has(source)) continue;

    const oldPath = extractStoragePath(source, STORAGE_BUCKET);
    if (!oldPath) continue;

    const rest =
      oldPath.startsWith(`${fromFolder}/`) ?
        oldPath.slice(fromFolder.length + 1)
      : null;
    if (!rest) continue; // файл лежит не там, где ожидали — не трогаем

    const newPath = `${toFolder}/${rest}`;
    if (newPath === oldPath) continue;

    const { error: copyError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .copy(oldPath, newPath);
    if (copyError) {
      throw new Error(`Не удалось переместить файл: ${copyError.message}`);
    }
    await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(newPath);
    urlMap.set(source, data.publicUrl);
    applied.push({ fromPath: oldPath, toPath: newPath });
  }

  return { urlMap, applied };
};

/** Откатывает перемещения в обратном порядке — если запись в базе не сохранилась. */
export const revertStorageMoves = async (
  applied: StorageMoveResult[],
): Promise<void> => {
  for (const move of [...applied].reverse()) {
    try {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .copy(move.toPath, move.fromPath);
      await supabase.storage.from(STORAGE_BUCKET).remove([move.toPath]);
    } catch {
      // лучшее усилие: файл останется в новом месте, это не блокирует работу
    }
  }
};
