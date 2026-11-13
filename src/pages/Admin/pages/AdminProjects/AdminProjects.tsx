import { useEffect, useRef, useState, type FormEvent } from "react";

import { useTranslation } from "react-i18next";

import type { TFunction } from "i18next";

import { supabase } from "@/utils";

import {
  GALLERY_FALLBACK_CATEGORY,
  getSlugError,
  getErrorMessage,
  moveStorageFiles,
  revertStorageMoves,
  sanitizeSlug,
  type StorageMove,
  type StorageMoveResult,
} from "@/utils";

import {
  Button,
  FormItem,
  ImageUploadField,
  Input,
  ProjectCard,
  Select,
  Tabs,
  TabsItem,
  Text,
  Textarea,
  Title,
} from "@/components";

import styles from "./AdminProjects.module.scss";

type Localized = { ru?: string; en?: string } | null;

type ProjectStatus = "draft" | "published";

type LinkItem = { url: string; type: string | null; text: Localized };
type GalleryCategory = { id: string; name: Localized };
type GalleryItem = {
  url: string;
  title: Localized;
  category: GalleryCategory | null;
};

type Project = {
  id: string;
  slug: string;
  created_at: string;
  status?: ProjectStatus;
  title: Localized;
  description: Localized;
  description_mini: Localized;
  history: Localized;
  role: Localized;
  logo_url: Localized;
  snippet_url: Localized;
  links: LinkItem[] | null;
  gallery: GalleryItem[] | null;
  category_id: string | null;
};

type Category = {
  id: string;
  slug: string;
  name: Localized;
  display_order: number;
};

type Skill = {
  id: string;
  name: Localized;
  category_id: string | null;
};

type SkillCategory = {
  id: string;
  name: Localized;
};

type LinkType = "website" | "telegram" | "vk" | "ok" | "github";

// В базу пишется value (ключ), в селекте показывается label
const LINK_TYPES: { value: LinkType }[] = [
  { value: "website" },
  { value: "telegram" },
  { value: "vk" },
  { value: "ok" },
  { value: "github" },
];

type LinkForm = {
  url: string;
  type: LinkType;
  textRu: string;
  textEn: string;
};

type GalleryForm = {
  url: string;
  fileKey: string;
  titleRu: string;
  titleEn: string;
  categoryId: string;
  categoryNameRu: string;
  categoryNameEn: string;
  // Папка, в которую файл реально загружен в Storage: id категории или "other".
  // null = файл ещё не загружен или это старая запись без категории
  uploadedCategoryId: string | null;
};

type FormData = {
  slug: string;
  createdAt: string;
  categoryId: string;
  status: ProjectStatus;
  titleRu: string;
  titleEn: string;
  miniRu: string;
  miniEn: string;
  descriptionRu: string;
  descriptionEn: string;
  historyRu: string;
  historyEn: string;
  roleRu: string;
  roleEn: string;
  logoUrl: string;
  snippetUrl: string;
};

// Ошибки по полям формы; ошибки ссылок адресуются индексом строки
type FieldErrors = {
  slug?: string;
  titleRu?: string;
  titleEn?: string;
  links: Record<number, string>;
};

// Табы статусов списка проектов
type StatusTab = "all" | ProjectStatus;

const EMPTY_ERRORS: FieldErrors = { links: {} };

// Собираем jsonb из пары полей; если оба пусты — пустой объект, как в базе
const toJsonb = (ru: string, en: string): Record<string, string> => {
  const value: Record<string, string> = {};
  if (ru.trim()) value.ru = ru.trim();
  if (en.trim()) value.en = en.trim();
  return value;
};

// Обратно: jsonb -> строка поля формы
const fromJsonb = (value: Localized, key: "ru" | "en"): string =>
  value ? (value[key] ?? "") : "";

const EMPTY_LINK: LinkForm = {
  url: "",
  type: "website",
  textRu: "",
  textEn: "",
};

// Уникальное имя файла для Storage: одинаковые названия не перезапишут друг друга
const galleryFileKey = () =>
  `Gallery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const emptyGalleryItem = (): GalleryForm => ({
  url: "",
  fileKey: galleryFileKey(),
  titleRu: "",
  titleEn: "",
  categoryId: "",
  categoryNameRu: "",
  categoryNameEn: "",
  uploadedCategoryId: null,
});

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: FormData = {
  slug: "",
  createdAt: today(),
  categoryId: "",
  status: "draft",
  titleRu: "",
  titleEn: "",
  miniRu: "",
  miniEn: "",
  descriptionRu: "",
  descriptionEn: "",
  historyRu: "",
  historyEn: "",
  roleRu: "",
  roleEn: "",
  logoUrl: "",
  snippetUrl: "",
};

// ─── Валидация ──────────────────────────────────────────────────────────

// Ссылка: непустое поле должно быть валидным http(s)-URL.
// Пустое поле не ошибка — такие строки отфильтруются при сохранении
const getLinkUrlError = (url: string, t: TFunction): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return t(
        "admin.error.link_url_protocol",
        "Ссылка должна начинаться с http:// или https://",
      );
    }
    return null;
  } catch {
    return t("admin.error.link_url_invalid", "Некорректный URL");
  }
};

// isPublishing: публикация требует заполненных названий; черновик — нет
const validateForm = (
  form: FormData,
  links: LinkForm[],
  t: TFunction,
  isPublishing: boolean,
): FieldErrors => {
  const errors: FieldErrors = { links: {} };

  // Слаг нужен всегда: он определяет папку проекта в Storage.
  // Пустое поле на сабмите — ошибка, непустое — проверка правилами
  const slugTrimmed = form.slug.trim();
  if (!slugTrimmed) {
    errors.slug = t("admin.error.slug_required", "Укажите слаг проекта");
  } else {
    errors.slug = getSlugError(slugTrimmed, t) ?? undefined;
  }

  if (isPublishing) {
    if (!form.titleRu.trim()) {
      errors.titleRu = t("admin.error.title_required", "Укажите название");
    }
    if (!form.titleEn.trim()) {
      errors.titleEn = t("admin.error.title_required", "Укажите название");
    }
  }

  links.forEach((link, index) => {
    const linkError = getLinkUrlError(link.url, t);
    if (linkError) errors.links[index] = linkError;
  });

  return errors;
};

const hasErrors = (errors: FieldErrors): boolean =>
  Boolean(errors.slug || errors.titleRu || errors.titleEn) ||
  Object.keys(errors.links).length > 0;

export const AdminProjects = () => {
  const { t } = useTranslation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [links, setLinks] = useState<LinkForm[]>([]);
  const [gallery, setGallery] = useState<GalleryForm[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  // Ошибки показываем после первой попытки сохранения — до этого не мешаем
  const [submitted, setSubmitted] = useState(false);

  // Активный таб статусов: все / опубликованные / черновики
  const [statusTab, setStatusTab] = useState<StatusTab>("all");

  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // При открытии вкладки всегда стартуем сверху: иначе браузер
  // восстанавливает прежнюю позицию скролла или прыгает к сфокусированному
  // элементу в нижней части формы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Скролл на следующий кадр и ручным расчётом координат:
  // в тот же тик, что и setState, цели в DOM ещё нет, а scrollIntoView
  // может быть прерван перерендером; расчёт через getBoundingClientRect
  // работает и при скролле окна, и внутри контейнера с overflow
  const scrollToRef = (ref: React.RefObject<HTMLElement | null>) => {
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;

      // Читаем scroll-margin-top из CSS: при ручном scrollTo браузер
      // его не применяет, поэтому учитываем сами
      const marginTop =
        parseFloat(window.getComputedStyle(el).scrollMarginTop) || 0;

      // Если у родителя есть собственный скролл — прокручиваем его,
      // иначе окно
      let scrollParent: HTMLElement | null = el.parentElement;
      while (scrollParent) {
        const style = window.getComputedStyle(scrollParent);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          const target =
            scrollParent.scrollTop +
            (el.getBoundingClientRect().top -
              scrollParent.getBoundingClientRect().top) -
            marginTop;
          scrollParent.scrollTo({ top: target, behavior: "smooth" });
          return;
        }
        scrollParent = scrollParent.parentElement;
      }

      const top = el.getBoundingClientRect().top + window.scrollY - marginTop;
      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  // Опции селекта категорий: value — id в базе, пустая строка = «без категории»
  const categoryOptions = [
    { value: "", label: t("admin.category_none", "Без категории") },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name?.ru ?? category.slug,
    })),
  ];

  const linkTypeOptions = LINK_TYPES.map(({ value }) => ({
    value,
    label: t(`admin.link_type.${value}`),
  }));

  // Фильтрация по активному табу статусов
  const visibleProjects =
    statusTab === "all" ? projects : (
      projects.filter((project) => project.status === statusTab)
    );

  const publishedCount = projects.filter(
    (project) => project.status === "published",
  ).length;
  const draftCount = projects.length - publishedCount;

  useEffect(() => {
    if (error && errorRef.current) {
      scrollToRef(errorRef);
    }
  }, [error]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [projectsRes, categoriesRes, skillsRes, skillCategoriesRes] =
        await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("projects_categories")
            .select("id, slug, name, display_order")
            .order("display_order", { ascending: true }),
          supabase
            .from("skills")
            .select("id, name, category_id, display_order")
            .order("display_order", { ascending: true }),
          supabase
            .from("skills_categories")
            .select("id, name, display_order")
            .order("display_order", { ascending: true }),
        ]);

      if (
        projectsRes.error ||
        categoriesRes.error ||
        skillsRes.error ||
        skillCategoriesRes.error
      ) {
        setError(
          t("admin.error.data_load_failed", "Не удалось загрузить данные"),
        );
        setIsLoading(false);
        return;
      }

      setProjects((projectsRes.data as unknown as Project[]) ?? []);
      setCategories((categoriesRes.data as unknown as Category[]) ?? []);
      setSkills((skillsRes.data as unknown as Skill[]) ?? []);
      setSkillCategories(
        (skillCategoriesRes.data as unknown as SkillCategory[]) ?? [],
      );
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const loadProjectSkills = async (projectId: string) => {
    const { data } = await supabase
      .from("project_skills")
      .select("skill_id")
      .eq("project_id", projectId);

    return new Set(
      ((data as { skill_id: string }[]) ?? []).map((row) => row.skill_id),
    );
  };

  const startCreate = () => {
    setEditingId(null);
    setOriginalSlug(null);
    setForm({ ...EMPTY_FORM, createdAt: today() });
    setLinks([]);
    setGallery([]);
    setSelectedSkillIds(new Set());
    setErrors(EMPTY_ERRORS);
    setSubmitted(false);
  };

  const startEdit = async (project: Project) => {
    // Скроллим сразу, не дожидаясь загрузки навыков из базы
    scrollToRef(formRef);

    setEditingId(project.id);
    setOriginalSlug(project.slug);
    setForm({
      slug: project.slug,
      createdAt: project.created_at ?? today(),
      categoryId: project.category_id ?? "",
      status: project.status ?? "draft",
      titleRu: fromJsonb(project.title, "ru"),
      titleEn: fromJsonb(project.title, "en"),
      miniRu: fromJsonb(project.description_mini, "ru"),
      miniEn: fromJsonb(project.description_mini, "en"),
      descriptionRu: fromJsonb(project.description, "ru"),
      descriptionEn: fromJsonb(project.description, "en"),
      historyRu: fromJsonb(project.history, "ru"),
      historyEn: fromJsonb(project.history, "en"),
      roleRu: fromJsonb(project.role, "ru"),
      roleEn: fromJsonb(project.role, "en"),
      logoUrl:
        fromJsonb(project.logo_url, "ru") || fromJsonb(project.logo_url, "en"),
      snippetUrl:
        fromJsonb(project.snippet_url, "ru") ||
        fromJsonb(project.snippet_url, "en"),
    });
    setLinks(
      (project.links ?? []).map((link) => ({
        url: link.url ?? "",
        // если у старой записи тип не из списка — подставляем website
        type:
          LINK_TYPES.some(({ value }) => value === (link.type ?? "")) ?
            (link.type as LinkType)
          : "website",
        textRu: fromJsonb(link.text, "ru"),
        textEn: fromJsonb(link.text, "en"),
      })),
    );
    setGallery(
      (project.gallery ?? []).map((item) => ({
        url: item.url ?? "",
        fileKey: galleryFileKey(),
        titleRu: fromJsonb(item.title, "ru"),
        titleEn: fromJsonb(item.title, "en"),
        categoryId: item.category?.id ?? "",
        categoryNameRu: fromJsonb(item.category?.name ?? null, "ru"),
        categoryNameEn: fromJsonb(item.category?.name ?? null, "en"),
        uploadedCategoryId: item.category?.id ?? null,
      })),
    );
    setSelectedSkillIds(await loadProjectSkills(project.id));
    setErrors(EMPTY_ERRORS);
    setSubmitted(false);
  };

  // Обновление полей формы с живой ревалидацией после первой попытки сабмита.
  // Апдейтеры без вложенных setState: сайд-эффекты внутри функций-обновлений
  // могут выполняться дважды в StrictMode и усиливают ререндеры
  const updateForm = (patch: Partial<FormData>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (submitted) {
      setErrors(validateForm(next, links, t, next.status === "published"));
    }
  };

  const updateLinks = (
    next: LinkForm[] | ((prev: LinkForm[]) => LinkForm[]),
  ) => {
    const resolved =
      typeof next === "function" ?
        (next as (p: LinkForm[]) => LinkForm[])(links)
      : next;
    setLinks(resolved);
    if (submitted) {
      setErrors(validateForm(form, resolved, t, form.status === "published"));
    }
  };

  // Показ ошибки со скроллом: на момент setState блок ошибки ещё не
  // отрендерен, поэтому scrollToRef откладывает прокрутку на следующий кадр
  const showError = (message: string) => {
    setError(message);
    scrollToRef(errorRef);
  };

  // Сохранение с явным статусом: "draft" — черновик, "published" — публикация.
  // Статус передаётся кнопкой, а не берётся из формы: иначе кнопка
  // «Опубликовать» на черновике сохраняла бы его снова как черновик
  const handleSave = async (finalStatus: ProjectStatus) => {
    setError(null);

    const validation = validateForm(
      form,
      links,
      t,
      finalStatus === "published",
    );
    if (hasErrors(validation)) {
      setErrors(validation);
      setSubmitted(true);
      // Поднимаем форму: ошибки подсвечены в полях, а сам блок ошибок
      // вверху не показывается, поэтому скроллим к форме целиком
      scrollToRef(formRef);
      return;
    }

    setIsSaving(true);

    let slug: string;
    try {
      slug = sanitizeSlug(form.slug);
    } catch {
      showError(t("admin.error.slug_invalid", "Укажите корректный слаг"));
      setIsSaving(false);
      return;
    }

    const slugChanged =
      editingId !== null && originalSlug !== null && originalSlug !== slug;

    // Собираем перемещения файлов.
    // Смена слага: логотип и сниппет меняют корневую папку; у галереи
    // файл идёт из своей исходной подпапки в новую папку проекта.
    // Смена категории галереи: файл уезжает в новую подпапку
    const moves: StorageMove[] = [];

    if (slugChanged) {
      if (form.logoUrl.trim()) {
        moves.push({
          url: form.logoUrl,
          fromFolder: originalSlug as string,
          toFolder: slug,
        });
      }
      if (form.snippetUrl.trim()) {
        moves.push({
          url: form.snippetUrl,
          fromFolder: originalSlug as string,
          toFolder: slug,
        });
      }
    }

    gallery.forEach((item) => {
      if (!item.url.trim()) return;
      const newCategoryId = item.categoryId.trim() || GALLERY_FALLBACK_CATEGORY;
      const categoryChanged =
        item.uploadedCategoryId !== null &&
        item.uploadedCategoryId !== newCategoryId;
      if (!slugChanged && !categoryChanged) return;

      const fromCategoryId =
        item.uploadedCategoryId || GALLERY_FALLBACK_CATEGORY;
      moves.push({
        url: item.url,
        fromFolder: `${slugChanged ? (originalSlug as string) : slug}/Screenshots/${fromCategoryId}`,
        toFolder: `${slug}/Screenshots/${newCategoryId}`,
      });
    });

    // Перемещаем файлы до записи в базу: если move не удался, база не тронута
    let urlMap = new Map<string, string>();
    let applied: StorageMoveResult[] = [];

    if (moves.length > 0) {
      try {
        const result = await moveStorageFiles(moves);
        urlMap = result.urlMap;
        applied = result.applied;
      } catch (e) {
        showError(
          getErrorMessage(
            e,
            t("admin.error.move_failed", "Не удалось переместить файлы"),
          ),
        );
        setIsSaving(false);
        return;
      }
    }

    const mapUrl = (url: string) => urlMap.get(url.trim()) ?? url.trim();

    const payload = {
      slug,
      created_at: form.createdAt || today(),
      category_id: form.categoryId || null,
      status: finalStatus,
      title: toJsonb(form.titleRu, form.titleEn),
      description_mini: toJsonb(form.miniRu, form.miniEn),
      description: toJsonb(form.descriptionRu, form.descriptionEn),
      history: toJsonb(form.historyRu, form.historyEn),
      role: toJsonb(form.roleRu, form.roleEn),
      logo_url: mapUrl(form.logoUrl) ? { ru: mapUrl(form.logoUrl) } : {},
      snippet_url:
        mapUrl(form.snippetUrl) ? { ru: mapUrl(form.snippetUrl) } : {},
      links: links
        .filter((link) => link.url.trim())
        .map((link) => ({
          url: link.url.trim(),
          type: link.type,
          text: toJsonb(link.textRu, link.textEn),
        })),
      gallery: gallery
        .filter((item) => item.url.trim())
        .map((item) => ({
          url: mapUrl(item.url),
          title: toJsonb(item.titleRu, item.titleEn),
          category:
            item.categoryId.trim() ?
              {
                id: item.categoryId.trim(),
                name: toJsonb(item.categoryNameRu, item.categoryNameEn),
              }
            : null,
        })),
    };

    const request =
      editingId ?
        supabase.from("projects").update(payload).eq("id", editingId)
      : supabase.from("projects").insert(payload);

    const { data: saved, error: saveError } = await request
      .select()
      .maybeSingle();

    if (saveError) {
      // Откат перемещений, чтобы файлы не остались в новых папках
      if (applied.length > 0) {
        const revert = await revertStorageMoves(applied);
        if (revert.failed.length > 0) {
          showError(
            t("admin.error.revert_failed", {
              defaultValue:
                "Сохранение не удалось, и {{count}} файл(ов) не вернулись на прежнее место — проверьте хранилище",
              count: revert.failed.length,
            }),
          );
          setIsSaving(false);
          return;
        }
      }

      showError(
        saveError.code === "23505" ?
          t("admin.error.slug_taken", "Такой slug уже занят")
        : t("admin.error.save_failed", "Не удалось сохранить проект"),
      );
      setIsSaving(false);
      return;
    }

    // ID проекта: из ответа базы, из редактирования или refetch по slug,
    // если RLS скрыл строку после insert
    let projectId: string | null = saved?.id ?? editingId;

    if (!projectId) {
      const { data: row, error: refetchError } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (refetchError) {
        showError(
          getErrorMessage(
            refetchError,
            t("admin.error.save_failed", "Не удалось сохранить проект"),
          ),
        );
        setIsSaving(false);
        return;
      }
      projectId = row?.id ?? null;
    }

    if (!projectId) {
      // Не смогли определить проект — данные уже записаны, но доводить до
      // пользователя лучше честно, чем терять навыки молча
      showError(
        t(
          "admin.error.skills_no_project",
          "Проект сохранён, но не удалось определить его ID — свяжите навыки вручную",
        ),
      );
      setIsSaving(false);
      return;
    }

    // Синхронизация навыков: дельта вместо wipe-and-replace.
    // Так сбой insert не стирает существующие связки
    const { data: existingRows, error: existingError } = await supabase
      .from("project_skills")
      .select("skill_id")
      .eq("project_id", projectId);

    if (existingError) {
      showError(
        getErrorMessage(
          existingError,
          t(
            "admin.error.skills_sync_failed",
            "Не удалось синхронизировать навыки",
          ),
        ),
      );
      setIsSaving(false);
      return;
    }

    const existing = new Set(
      ((existingRows as { skill_id: string }[]) ?? []).map(
        (row) => row.skill_id,
      ),
    );
    const toDelete = [...existing].filter((id) => !selectedSkillIds.has(id));
    const toInsert = [...selectedSkillIds].filter((id) => !existing.has(id));

    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from("project_skills")
        .delete()
        .eq("project_id", projectId)
        .in("skill_id", toDelete);

      if (delError) {
        showError(
          getErrorMessage(
            delError,
            t(
              "admin.error.skills_sync_failed",
              "Не удалось синхронизировать навыки",
            ),
          ),
        );
        setIsSaving(false);
        return;
      }
    }

    if (toInsert.length > 0) {
      const { error: insError } = await supabase.from("project_skills").insert(
        toInsert.map((skillId) => ({
          project_id: projectId,
          skill_id: skillId,
        })),
      );

      if (insError) {
        showError(
          getErrorMessage(
            insError,
            t(
              "admin.error.skills_sync_failed",
              "Не удалось синхронизировать навыки",
            ),
          ),
        );
        setIsSaving(false);
        return;
      }
    }

    const { data: fresh } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    setProjects((fresh as unknown as Project[]) ?? []);
    setIsSaving(false);
    startCreate();
  };

  const handleDelete = async (project: Project) => {
    if (
      !window.confirm(
        t("admin.error.delete_confirm", {
          defaultValue: "Удалить проект «{{name}}»?",
          name: fromJsonb(project.title, "ru") || project.slug,
        }),
      )
    ) {
      return;
    }

    await supabase.from("project_skills").delete().eq("project_id", project.id);

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (deleteError) {
      showError(t("admin.error.delete_failed", "Не удалось удалить проект"));
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    if (editingId === project.id) startCreate();
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  const updateGalleryItem = (index: number, patch: Partial<GalleryForm>) => {
    setGallery((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  return (
    <section className={styles.wrapper}>
      <Title>{t("admin.projects_title", "Проекты")}</Title>

      {error && (
        <div ref={errorRef} className={styles.error_wrapper}>
          <Text className={styles.error}>{error}</Text>
        </div>
      )}

      {isLoading ?
        <Text size="xs" mode="secondary">
          {t("admin.loading", "Загружаем...")}
        </Text>
      : <>
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(form.status);
            }}
            className={styles.form}
            noValidate
          >
            <div className={styles.row}>
              <FormItem
                id="slug"
                top={t("admin.field.slug", "Ссылка на проект*")}
                error={errors.slug}
              >
                <Input
                  type="text"
                  name="project-slug"
                  autoComplete="off"
                  placeholder="slug"
                  value={form.slug}
                  onChange={(e) => updateForm({ slug: e.target.value })}
                />
              </FormItem>
              <FormItem
                id="createdAt"
                top={t("admin.field.created_at", "Дата выхода проекта")}
              >
                <Input
                  type="date"
                  value={form.createdAt}
                  onChange={(e) => updateForm({ createdAt: e.target.value })}
                />
              </FormItem>
              <FormItem
                id="categoryId"
                top={t("admin.field.category", "Категория")}
              >
                <Select
                  options={categoryOptions}
                  value={form.categoryId}
                  onChange={(categoryId) => updateForm({ categoryId })}
                  label={t("admin.field.category", "Категория проекта")}
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem
                id="titleRu"
                top={t("admin.field.title_ru", "Название проекта (RU)")}
                error={errors.titleRu}
              >
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder={t("admin.field.title_ru", "Название (RU)")}
                  value={form.titleRu}
                  onChange={(e) => updateForm({ titleRu: e.target.value })}
                />
              </FormItem>
              <FormItem
                id="titleEn"
                top={t("admin.field.title_en", "Название проекта (EN)")}
                error={errors.titleEn}
              >
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder={t("admin.field.title_en", "Название (EN)")}
                  value={form.titleEn}
                  onChange={(e) => updateForm({ titleEn: e.target.value })}
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem
                id="miniRu"
                top={t("admin.field.mini_ru", "Короткое описание (RU)")}
              >
                <Textarea
                  placeholder={t(
                    "admin.field.mini_ru",
                    "Короткое описание (RU)",
                  )}
                  value={form.miniRu}
                  onChange={(e) => updateForm({ miniRu: e.target.value })}
                />
              </FormItem>
              <FormItem
                id="miniEn"
                top={t("admin.field.mini_en", "Короткое описание (EN)")}
              >
                <Textarea
                  placeholder={t(
                    "admin.field.mini_en",
                    "Короткое описание (EN)",
                  )}
                  value={form.miniEn}
                  onChange={(e) => updateForm({ miniEn: e.target.value })}
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem
                id="descriptionRu"
                top={t("admin.field.description_ru", "Описание (RU)")}
              >
                <Textarea
                  rows={4}
                  placeholder={t("admin.field.description_ru", "Описание (RU)")}
                  value={form.descriptionRu}
                  onChange={(e) =>
                    updateForm({ descriptionRu: e.target.value })
                  }
                />
              </FormItem>
              <FormItem
                id="descriptionEn"
                top={t("admin.field.description_en", "Описание (EN)")}
              >
                <Textarea
                  rows={4}
                  placeholder={t("admin.field.description_en", "Описание (EN)")}
                  value={form.descriptionEn}
                  onChange={(e) =>
                    updateForm({ descriptionEn: e.target.value })
                  }
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem
                id="historyRu"
                top={t("admin.field.history_ru", "История (RU)")}
              >
                <Textarea
                  rows={4}
                  placeholder={t("admin.field.history_ru", "История (RU)")}
                  value={form.historyRu}
                  onChange={(e) => updateForm({ historyRu: e.target.value })}
                />
              </FormItem>
              <FormItem
                id="historyEn"
                top={t("admin.field.history_en", "История (EN)")}
              >
                <Textarea
                  rows={4}
                  placeholder={t("admin.field.history_en", "История (EN)")}
                  value={form.historyEn}
                  onChange={(e) => updateForm({ historyEn: e.target.value })}
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem id="roleRu" top={t("admin.field.role_ru", "Роль (RU)")}>
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder={t("admin.field.role_ru", "Роль (RU)")}
                  value={form.roleRu}
                  onChange={(e) => updateForm({ roleRu: e.target.value })}
                />
              </FormItem>
              <FormItem id="roleEn" top={t("admin.field.role_en", "Роль (EN)")}>
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder={t("admin.field.role_en", "Роль (EN)")}
                  value={form.roleEn}
                  onChange={(e) => updateForm({ roleEn: e.target.value })}
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem id="logoUrl" top={t("admin.field.logo", "Логотип")}>
                <ImageUploadField
                  value={form.logoUrl}
                  folder={form.slug}
                  fileName="Logo"
                  onChange={(url) => updateForm({ logoUrl: url })}
                />
              </FormItem>
              <FormItem
                id="snippetUrl"
                top={t("admin.field.snippet", "Сниппет (превью-картинка)")}
              >
                <ImageUploadField
                  value={form.snippetUrl}
                  folder={form.slug}
                  fileName="Snippet"
                  onChange={(url) => updateForm({ snippetUrl: url })}
                />
              </FormItem>
            </div>

            <div className={styles.editorBlock}>
              <Title size="sm">{t("admin.section.links", "Ссылки")}</Title>
              {links.map((link, index) => (
                <div key={index} className={styles.links_form}>
                  <FormItem
                    id={`link-url-${index}`}
                    error={errors.links[index]}
                  >
                    <Input
                      type="url"
                      autoComplete="off"
                      placeholder={t("admin.field.link_url", "URL")}
                      value={link.url}
                      onChange={(e) =>
                        updateLinks((prev) =>
                          prev.map((item, i) =>
                            i === index ?
                              { ...item, url: e.target.value }
                            : item,
                          ),
                        )
                      }
                    />
                  </FormItem>
                  <Select
                    options={linkTypeOptions}
                    value={link.type}
                    onChange={(type) =>
                      updateLinks((prev) =>
                        prev.map((item, i) =>
                          i === index ?
                            { ...item, type: type as LinkType }
                          : item,
                        ),
                      )
                    }
                    label={t("admin.field.link_type", "Тип ссылки")}
                  />
                  <Input
                    type="text"
                    autoComplete="off"
                    placeholder={t("admin.field.link_text_ru", "Подпись (RU)")}
                    value={link.textRu}
                    onChange={(e) =>
                      updateLinks((prev) =>
                        prev.map((item, i) =>
                          i === index ?
                            { ...item, textRu: e.target.value }
                          : item,
                        ),
                      )
                    }
                  />
                  <Input
                    type="text"
                    autoComplete="off"
                    placeholder={t("admin.field.link_text_en", "Подпись (EN)")}
                    value={link.textEn}
                    onChange={(e) =>
                      updateLinks((prev) =>
                        prev.map((item, i) =>
                          i === index ?
                            { ...item, textEn: e.target.value }
                          : item,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      updateLinks((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
              <Button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  updateLinks((prev) => [...prev, { ...EMPTY_LINK }])
                }
              >
                {t("admin.action.add_link", "+ Ссылка")}
              </Button>
            </div>

            <div className={styles.editorBlock}>
              <Title size="sm">{t("admin.section.gallery", "Галерея")}</Title>
              {gallery.map((item, index) => (
                <div key={index} className={styles.galleryItem}>
                  <FormItem
                    id={`gallery-image-${index}`}
                    top={t("admin.field.gallery_image", {
                      defaultValue: "Изображение {{number}}",
                      number: index + 1,
                    })}
                  >
                    <ImageUploadField
                      value={item.url}
                      folder={form.slug}
                      fileName={item.fileKey}
                      subfolder={`Screenshots/${item.categoryId.trim() || GALLERY_FALLBACK_CATEGORY}`}
                      onChange={(url) =>
                        updateGalleryItem(index, {
                          url,
                          // запоминаем папку, куда файл лег фактически:
                          // без категории это "other", а не null
                          uploadedCategoryId:
                            item.categoryId.trim() || GALLERY_FALLBACK_CATEGORY,
                        })
                      }
                    />
                  </FormItem>

                  <div className={styles.row}>
                    <Input
                      type="text"
                      autoComplete="off"
                      placeholder={t(
                        "admin.field.gallery_title_ru",
                        "Подпись (RU)",
                      )}
                      value={item.titleRu}
                      onChange={(e) =>
                        updateGalleryItem(index, { titleRu: e.target.value })
                      }
                    />
                    <Input
                      type="text"
                      autoComplete="off"
                      placeholder={t(
                        "admin.field.gallery_title_en",
                        "Подпись (EN)",
                      )}
                      value={item.titleEn}
                      onChange={(e) =>
                        updateGalleryItem(index, { titleEn: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.row}>
                    <Input
                      type="text"
                      autoComplete="off"
                      placeholder={t(
                        "admin.field.gallery_category_id",
                        "Категория (id, например ios)",
                      )}
                      value={item.categoryId}
                      onChange={(e) =>
                        updateGalleryItem(index, { categoryId: e.target.value })
                      }
                    />
                    <Input
                      type="text"
                      autoComplete="off"
                      placeholder={t(
                        "admin.field.gallery_category_ru",
                        "Категория (RU)",
                      )}
                      value={item.categoryNameRu}
                      onChange={(e) =>
                        updateGalleryItem(index, {
                          categoryNameRu: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="text"
                      autoComplete="off"
                      placeholder={t(
                        "admin.field.gallery_category_en",
                        "Категория (EN)",
                      )}
                      value={item.categoryNameEn}
                      onChange={(e) =>
                        updateGalleryItem(index, {
                          categoryNameEn: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      setGallery((prev) => prev.filter((_, i) => i !== index))
                    }
                    mode="secondary"
                  >
                    {t("admin.action.remove_image", "✕ Убрать изображение")}
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  setGallery((prev) => [...prev, emptyGalleryItem()])
                }
              >
                {t("admin.action.add_image", "+ Изображение")}
              </Button>
            </div>

            <div className={styles.editorBlock}>
              <Title size="sm">
                {t("admin.section.skills", "Навыки проекта")}
              </Title>
              {skillCategories.map((category) => (
                <div key={category.id} className={styles.skillGroup}>
                  <span className={styles.skillGroupTitle}>
                    {category.name?.ru ?? "—"}
                  </span>
                  <div className={styles.skillList}>
                    {skills
                      .filter((skill) => skill.category_id === category.id)
                      .map((skill) => (
                        <label key={skill.id} className={styles.skillLabel}>
                          <input
                            type="checkbox"
                            checked={selectedSkillIds.has(skill.id)}
                            onChange={() => toggleSkill(skill.id)}
                          />
                          <Text size="xs">{skill.name?.ru ?? "—"}</Text>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              {/* Черновик: сохраняем без публикации, валидация мягче */}
              <Button
                type="button"
                className={styles.secondaryButton}
                mode="secondary"
                disabled={isSaving}
                onClick={() => handleSave("draft")}
              >
                {editingId !== null && form.status === "published" ?
                  t("admin.action.revert_to_draft", "Вернуть в черновик")
                : t("admin.action.save_draft", "Сохранить черновик")}
              </Button>

              {/* Публикация: статус жёсткий, полная валидация */}
              <Button
                type="button"
                className={styles.primaryButton}
                disabled={isSaving}
                onClick={() => handleSave("published")}
              >
                {form.status === "published" ?
                  t("admin.action.save", "Сохранить")
                : t("admin.action.publish", "Опубликовать проект")}
              </Button>

              {editingId !== null && (
                <Button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={startCreate}
                  mode="secondary"
                >
                  {t("admin.action.cancel", "Отменить")}
                </Button>
              )}
            </div>
          </form>

          {projects.length === 0 ?
            <Text size="xs" mode="secondary">
              {t("admin.empty_projects", "Проектов пока нет")}
            </Text>
          : <>
              <div className={styles.tabs_row}>
                <Tabs
                  selectedId={statusTab}
                  onSelectedIdChange={(id: string | number) => {
                    const next = id as StatusTab;
                    if (
                      next === "all" ||
                      next === "published" ||
                      next === "draft"
                    ) {
                      setStatusTab(next);
                    }
                  }}
                  layoutFillMode="auto"
                  withScrollToSelectedTab
                >
                  <TabsItem id="all">
                    {t("admin.status.all", "Все проекты")} ({projects.length})
                  </TabsItem>
                  <TabsItem id="published">
                    {t("admin.status.published_tab", "Опубликованные")} (
                    {publishedCount})
                  </TabsItem>
                  <TabsItem id="draft">
                    {t("admin.status.draft_tab", "Черновики")} ({draftCount})
                  </TabsItem>
                </Tabs>
              </div>

              {visibleProjects.length === 0 ?
                <Text size="xs" mode="secondary">
                  {t(
                    "admin.empty_projects_in_tab",
                    "В этой вкладке проектов нет",
                  )}
                </Text>
              : <div className={styles.projects_grid}>
                  {visibleProjects.map((project) => {
                    const title =
                      fromJsonb(project.title, "ru") || project.slug;
                    const description = fromJsonb(project.description, "ru");
                    const logo =
                      fromJsonb(project.logo_url, "ru") ||
                      fromJsonb(project.logo_url, "en");
                    const snippet =
                      fromJsonb(project.snippet_url, "ru") ||
                      fromJsonb(project.snippet_url, "en");

                    const category = categories.find(
                      (item) => item.id === project.category_id,
                    );
                    const categoryName =
                      category ? (category.name?.ru ?? category.slug) : "";

                    return (
                      <ProjectCard
                        key={project.id}
                        slug={project.slug}
                        logo={logo}
                        snippet={snippet}
                        title={title}
                        badge={
                          project.status === "draft" ?
                            t("admin.status.draft", "черновик")
                          : null
                        }
                        description={description}
                        category={categoryName}
                        link={true}
                        actions={
                          <>
                            <Button
                              type="button"
                              mode="secondary"
                              className={styles.cardButton}
                              onClick={(e) => {
                                // Гасим событие, чтобы клик по кнопке не дошёл до Link
                                e.preventDefault();
                                e.stopPropagation();
                                startEdit(project);
                              }}
                            >
                              {t("admin.action.edit", "Изменить")}
                            </Button>
                            <Button
                              type="button"
                              mode="secondary"
                              className={styles.cardButton}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(project);
                              }}
                            >
                              {t("admin.action.delete", "Удалить")}
                            </Button>
                          </>
                        }
                      />
                    );
                  })}
                </div>
              }
            </>
          }
        </>
      }
    </section>
  );
};
