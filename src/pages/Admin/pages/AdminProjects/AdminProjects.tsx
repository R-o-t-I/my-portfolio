import { useEffect, useState, type FormEvent } from "react";
import { getSlugError, supabase } from "@/utils";

import {
  GALLERY_FALLBACK_CATEGORY,
  sanitizeSlug,
  moveStorageFiles,
  revertStorageMoves,
  type StorageMove,
  type StorageMoveResult,
} from "@/utils";

import {
  FormItem,
  ImageUploadField,
  Input,
  Text,
  Textarea,
  Title,
} from "@/components";

import styles from "./AdminProjects.module.scss";

type Localized = { ru?: string; en?: string } | null;

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
const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: "website", label: "Сайт" },
  { value: "telegram", label: "Telegram" },
  { value: "vk", label: "ВКонтакте" },
  { value: "ok", label: "Одноклассники" },
  { value: "github", label: "GitHub" },
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
  // null = файл ещё не загружен или это старая запись без категории.
  uploadedCategoryId: string | null;
};

type FormData = {
  slug: string;
  createdAt: string;
  categoryId: string;
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

export const AdminProjects = () => {
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
        setError("Не удалось загрузить данные");
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
  };

  const startEdit = async (project: Project) => {
    setEditingId(project.id);
    setOriginalSlug(project.slug);
    setForm({
      slug: project.slug,
      createdAt: project.created_at ?? today(),
      categoryId: project.category_id ?? "",
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

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    let slug: string;
    try {
      slug = sanitizeSlug(form.slug);
    } catch {
      setError("Укажите корректный slug");
      setIsSaving(false);
      return;
    }

    const slugChanged =
      editingId !== null && originalSlug !== null && originalSlug !== slug;

    // Собираем перемещения файлов.
    // Смена слага: логотип и сниппет меняют корневую папку; у галереи
    // файл идёт из своей исходной подпапки в новую папку проекта.
    // Смена категории галереи: файл уезжает в новую подпапку.
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
        setError(
          e instanceof Error ? e.message : "Не удалось переместить файлы",
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
        await revertStorageMoves(applied);
      }

      setError(
        saveError.code === "23505" ?
          "Такой slug уже занят"
        : "Не удалось сохранить проект",
      );
      setIsSaving(false);
      return;
    }

    const projectId = saved?.id ?? editingId;

    // Синхронизация навыков: чистим связки и пишем заново
    if (projectId) {
      await supabase
        .from("project_skills")
        .delete()
        .eq("project_id", projectId);

      if (selectedSkillIds.size > 0) {
        await supabase.from("project_skills").insert(
          [...selectedSkillIds].map((skillId) => ({
            project_id: projectId,
            skill_id: skillId,
          })),
        );
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
        `Удалить проект «${fromJsonb(project.title, "ru") || project.slug}»?`,
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
      setError("Не удалось удалить проект");
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
      <Title>Проекты</Title>

      {error && <Text className={styles.error}>{error}</Text>}

      {isLoading ?
        <Text size="xs" mode="secondary">
          Загружаем...
        </Text>
      : <>
          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.row}>
              <FormItem id="slug" top="Ссылка на проект*" error="error">
                <Input
                  type="text"
                  placeholder="slug (например, my_portfolio)"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  required
                />
              </FormItem>
              <FormItem id="createdAt" top="Дата выхода проекта" error="error">
                <Input
                  type="date"
                  value={form.createdAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, createdAt: e.target.value }))
                  }
                />
              </FormItem>
              <FormItem id="categoryId" top="Категория" error="error">
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, categoryId: e.target.value }))
                  }
                >
                  <option value="">— без категории —</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name?.ru ?? category.slug}
                    </option>
                  ))}
                </select>
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem id="titleRu" top="Название проекта (RU)*" error="error">
                <Input
                  type="text"
                  placeholder="Название (RU)"
                  value={form.titleRu}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, titleRu: e.target.value }))
                  }
                  required
                />
              </FormItem>
              <FormItem id="titleEn" top="Название проекта (EN)*" error="error">
                <Input
                  type="text"
                  placeholder="Название (EN)"
                  value={form.titleEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, titleEn: e.target.value }))
                  }
                  required
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem id="miniRu" top="Короткое описание (RU)" error="error">
                <Textarea
                  placeholder="Короткое описание (RU)"
                  value={form.miniRu}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, miniRu: e.target.value }))
                  }
                />
              </FormItem>
              <FormItem id="miniEn" top="Короткое описание (EN)" error="error">
                <Textarea
                  placeholder="Короткое описание (EN)"
                  value={form.miniEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, miniEn: e.target.value }))
                  }
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem id="descriptionRu" top="Описание (RU)" error="error">
                <Textarea
                  rows={4}
                  placeholder="Описание (RU)"
                  value={form.descriptionRu}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descriptionRu: e.target.value }))
                  }
                />
              </FormItem>
              <FormItem id="descriptionEn" top="Описание (EN)" error="error">
                <Textarea
                  rows={4}
                  placeholder="Описание (EN)"
                  value={form.descriptionEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descriptionEn: e.target.value }))
                  }
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem id="historyRu" top="История (RU)" error="error">
                <Textarea
                  rows={4}
                  placeholder="История (RU)"
                  value={form.historyRu}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, historyRu: e.target.value }))
                  }
                />
              </FormItem>
              <FormItem id="historyEn" top="История (EN)" error="error">
                <Textarea
                  rows={4}
                  placeholder="История (EN)"
                  value={form.historyEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, historyEn: e.target.value }))
                  }
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem id="roleRu" top="Роль (RU)" error="error">
                <Input
                  type="text"
                  placeholder="Роль (RU)"
                  value={form.roleRu}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, roleRu: e.target.value }))
                  }
                />
              </FormItem>
              <FormItem id="roleEn" top="Роль (EN)" error="error">
                <Input
                  type="text"
                  placeholder="Роль (EN)"
                  value={form.roleEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, roleEn: e.target.value }))
                  }
                />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem id="logoUrl" top="Логотип" error="error">
                <ImageUploadField
                  value={form.logoUrl}
                  folder={form.slug}
                  fileName="Logo"
                  onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
                />
              </FormItem>
              <FormItem
                id="snippetUrl"
                top="Сниппет (превью-картинка)"
                error="error"
              >
                <ImageUploadField
                  value={form.snippetUrl}
                  folder={form.slug}
                  fileName="Snippet"
                  onChange={(url) =>
                    setForm((p) => ({ ...p, snippetUrl: url }))
                  }
                />
              </FormItem>
            </div>

            <div className={styles.editorBlock}>
              <Title size="sm">Ссылки</Title>
              {links.map((link, index) => (
                <div key={index} className={styles.row}>
                  <Input
                    type="url"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) =>
                      setLinks((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item,
                        ),
                      )
                    }
                  />
                  <select
                    value={link.type}
                    onChange={(e) =>
                      setLinks((prev) =>
                        prev.map((item, i) =>
                          i === index ?
                            { ...item, type: e.target.value as LinkType }
                          : item,
                        ),
                      )
                    }
                  >
                    {LINK_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="text"
                    placeholder="Подпись (RU)"
                    value={link.textRu}
                    onChange={(e) =>
                      setLinks((prev) =>
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
                    placeholder="Подпись (EN)"
                    value={link.textEn}
                    onChange={(e) =>
                      setLinks((prev) =>
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
                      setLinks((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setLinks((prev) => [...prev, { ...EMPTY_LINK }])}
              >
                + Ссылка
              </button>
            </div>

            <div className={styles.editorBlock}>
              <Title size="sm">Галерея</Title>
              {gallery.map((item, index) => (
                <div key={index} className={styles.galleryItem}>
                  <FormItem
                    id="url"
                    top={`Изображение ${index + 1}`}
                    error="error"
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
                      placeholder="Подпись (RU)"
                      value={item.titleRu}
                      onChange={(e) =>
                        updateGalleryItem(index, { titleRu: e.target.value })
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Подпись (EN)"
                      value={item.titleEn}
                      onChange={(e) =>
                        updateGalleryItem(index, { titleEn: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.row}>
                    <Input
                      type="text"
                      placeholder="Категория (id, например ios)"
                      value={item.categoryId}
                      onChange={(e) =>
                        updateGalleryItem(index, { categoryId: e.target.value })
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Категория (RU)"
                      value={item.categoryNameRu}
                      onChange={(e) =>
                        updateGalleryItem(index, {
                          categoryNameRu: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Категория (EN)"
                      value={item.categoryNameEn}
                      onChange={(e) =>
                        updateGalleryItem(index, {
                          categoryNameEn: e.target.value,
                        })
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      setGallery((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    ✕ Убрать изображение
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  setGallery((prev) => [...prev, emptyGalleryItem()])
                }
              >
                + Изображение
              </button>
            </div>

            <div className={styles.editorBlock}>
              <Title size="sm">Навыки проекта</Title>
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
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSaving}
              >
                {editingId === null ? "Добавить проект" : "Сохранить"}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={startCreate}
                >
                  Отменить
                </button>
              )}
            </div>
          </form>

          {projects.length === 0 ?
            <Text size="xs" mode="secondary">
              Проектов пока нет
            </Text>
          : <ul className={styles.list}>
              {projects.map((project) => (
                <li key={project.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>
                      {fromJsonb(project.title, "ru") || project.slug}
                    </span>
                    <span className={styles.itemMeta}>
                      {project.slug} · {project.created_at}
                    </span>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => startEdit(project)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => handleDelete(project)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          }
        </>
      }
    </section>
  );
};
