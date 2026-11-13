import { useEffect, useState, type FormEvent } from "react";

import { useTranslation } from "react-i18next";

import { supabase } from "@/utils";

import { useAdminAuth } from "@/hooks/useAdminAuth";

import styles from "./AdminSkills.module.scss";

import {
  ColorField,
  Input,
  Separator,
  Text,
  Textarea,
  Title,
} from "@/components";

type SkillCategory = {
  id: string;
  id_name: string;
  name: { ru?: string; en?: string };
  display_order: number | null;
  icon: { ru?: string; en?: string } | null;
  icon_color: string | null;
};

type Skill = {
  id: string;
  category_id: string;
  name: { ru?: string; en?: string };
  display_order: number | null;
  skill_icon: { ru?: string; en?: string } | null;
  skill_icon_color: string | null;
};

type CategoryFormData = {
  nameRu: string;
  nameEn: string;
  idName: string;
  displayOrder: string;
  icon: string;
  iconColor: string;
};

type SkillFormData = {
  nameRu: string;
  nameEn: string;
  displayOrder: string;
  icon: string;
  iconColor: string;
};

const EMPTY_CATEGORY_FORM: CategoryFormData = {
  nameRu: "",
  nameEn: "",
  idName: "",
  displayOrder: "0",
  icon: "",
  iconColor: "",
};

const EMPTY_SKILL_FORM: SkillFormData = {
  nameRu: "",
  nameEn: "",
  displayOrder: "0",
  icon: "",
  iconColor: "",
};

export const AdminSkills = () => {
  const { t } = useTranslation();
  const { role } = useAdminAuth();

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormData>(EMPTY_CATEGORY_FORM);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState<SkillFormData>(EMPTY_SKILL_FORM);
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [categoriesRes, skillsRes] = await Promise.all([
        supabase
          .from("skills_categories")
          .select("id, id_name, name, display_order, icon, icon_color")
          .order("display_order", { ascending: true }),
        supabase
          .from("skills")
          .select(
            "id, category_id, name, display_order, skill_icon, skill_icon_color",
          )
          .order("display_order", { ascending: true }),
      ]);

      if (categoriesRes.error || skillsRes.error) {
        setError(
          t("admin.error.skills_load_failed", "Не удалось загрузить навыки"),
        );
        setIsLoading(false);
        return;
      }

      setCategories((categoriesRes.data as SkillCategory[]) ?? []);
      setSkills((skillsRes.data as Skill[]) ?? []);
      setIsLoading(false);
    };

    fetchData();
  }, [t]);

  // ---- Категории ----

  const startCategoryCreate = () => {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
  };

  const startCategoryEdit = (category: SkillCategory) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      nameRu: category.name?.ru ?? "",
      nameEn: category.name?.en ?? "",
      idName: category.id_name,
      displayOrder: String(category.display_order ?? 0),
      icon: category.icon?.ru ?? "",
      iconColor: category.icon_color ?? "",
    });
  };

  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingCategory(true);
    setError(null);

    const icon = categoryForm.icon.trim();

    const payload = {
      id_name: categoryForm.idName.trim(),
      name: { ru: categoryForm.nameRu.trim(), en: categoryForm.nameEn.trim() },
      display_order: Number(categoryForm.displayOrder) || 0,
      icon: icon ? { ru: icon, en: icon } : null,
      icon_color: categoryForm.iconColor.trim() || null,
    };
    const isEdit = editingCategoryId !== null;

    const request =
      isEdit ?
        supabase
          .from("skills_categories")
          .update(payload)
          .eq("id", editingCategoryId)
      : supabase.from("skills_categories").insert(payload);

    const { error: saveError } = await request.select();

    if (saveError) {
      setError(
        t("admin.error.category_save_failed", "Не удалось сохранить категорию"),
      );
      setIsSavingCategory(false);
      return;
    }

    const { data: fresh } = await supabase
      .from("skills_categories")
      .select("id, id_name, name, display_order, icon, icon_color")
      .order("display_order", { ascending: true });

    setCategories((fresh as SkillCategory[]) ?? []);
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setIsSavingCategory(false);
  };

  const handleDeleteCategory = async (category: SkillCategory) => {
    const categorySkills = skills.filter((s) => s.category_id === category.id);

    const confirmText =
      categorySkills.length > 0 ?
        t("admin.error.delete_category_with_skills", {
          defaultValue:
            "В категории «{{name}}» {{count}} навыков. Удалить категорию вместе с ними?",
          name: category.name?.ru ?? "—",
          count: categorySkills.length,
        })
      : t("admin.error.delete_category_confirm", {
          defaultValue: "Удалить категорию «{{name}}»?",
          name: category.name?.ru ?? "—",
        });

    if (!window.confirm(confirmText)) return;

    if (categorySkills.length > 0) {
      const { error: skillsDeleteError } = await supabase
        .from("skills")
        .delete()
        .in(
          "id",
          categorySkills.map((s) => s.id),
        );

      if (skillsDeleteError) {
        setError(
          t(
            "admin.error.skills_of_category_delete_failed",
            "Не удалось удалить навыки категории",
          ),
        );
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("skills_categories")
      .delete()
      .eq("id", category.id);

    if (deleteError) {
      setError(
        t("admin.error.category_delete_failed", "Не удалось удалить категорию"),
      );
      return;
    }

    setSkills((prev) => prev.filter((s) => s.category_id !== category.id));
    setCategories((prev) => prev.filter((c) => c.id !== category.id));

    if (selectedCategoryId === category.id) {
      setSelectedCategoryId(null);
    }
    if (editingCategoryId === category.id) {
      startCategoryCreate();
    }
  };

  // ---- Навыки ----

  const startSkillCreate = () => {
    setEditingSkillId(null);
    setSkillForm(EMPTY_SKILL_FORM);
  };

  const startSkillEdit = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setSkillForm({
      nameRu: skill.name?.ru ?? "",
      nameEn: skill.name?.en ?? "",
      displayOrder: String(skill.display_order ?? 0),
      icon: skill.skill_icon?.ru ?? "",
      iconColor: skill.skill_icon_color ?? "",
    });
  };

  const handleSkillSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;

    setIsSavingSkill(true);
    setError(null);

    // Иконка одинакова для обоих языков — пишем в оба ключа
    const icon = skillForm.icon.trim();

    const payload = {
      category_id: selectedCategoryId,
      name: { ru: skillForm.nameRu.trim(), en: skillForm.nameEn.trim() },
      display_order: Number(skillForm.displayOrder) || 0,
      skill_icon: icon ? { ru: icon, en: icon } : null,
      skill_icon_color: skillForm.iconColor.trim() || null,
    };
    const isEdit = editingSkillId !== null;

    const request =
      isEdit ?
        supabase.from("skills").update(payload).eq("id", editingSkillId)
      : supabase.from("skills").insert(payload);

    const { error: saveError } = await request.select();

    if (saveError) {
      setError(
        t("admin.error.skill_save_failed", "Не удалось сохранить навык"),
      );
      setIsSavingSkill(false);
      return;
    }

    const { data: fresh } = await supabase
      .from("skills")
      .select(
        "id, category_id, name, display_order, skill_icon, skill_icon_color",
      )
      .order("display_order", { ascending: true });

    setSkills((fresh as Skill[]) ?? []);
    setEditingSkillId(null);
    setSkillForm(EMPTY_SKILL_FORM);
    setIsSavingSkill(false);
  };

  const handleDeleteSkill = async (skill: Skill) => {
    if (
      !window.confirm(
        t("admin.error.delete_skill_confirm", {
          defaultValue: "Удалить навык «{{name}}»?",
          name: skill.name?.ru ?? "—",
        }),
      )
    ) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("skills")
      .delete()
      .eq("id", skill.id);

    if (deleteError) {
      setError(
        t("admin.error.skill_delete_failed", "Не удалось удалить навык"),
      );
      return;
    }

    setSkills((prev) => prev.filter((s) => s.id !== skill.id));
    if (editingSkillId === skill.id) {
      startSkillCreate();
    }
  };

  const selectedCategorySkills =
    selectedCategoryId ?
      skills.filter((s) => s.category_id === selectedCategoryId)
    : [];

  return (
    <section className={styles.wrapper}>
      <Title>{t("admin.skills_title", "Навыки")}</Title>

      {error && <Text className={styles.error}>{error}</Text>}

      {isLoading ?
        <Text size="xs" mode="secondary">
          {t("admin.loading", "Загружаем...")}
        </Text>
      : <div className={styles.columns}>
          <div className={styles.categories}>
            <Title size="sm">{t("admin.skills.categories", "Категории")}</Title>

            <form onSubmit={handleCategorySubmit} className={styles.form}>
              <Input
                type="text"
                placeholder={t(
                  "admin.field.id_name",
                  "id_name (например, dev)",
                )}
                value={categoryForm.idName}
                onChange={(e) =>
                  setCategoryForm((p) => ({ ...p, idName: e.target.value }))
                }
                required
              />
              <Input
                type="text"
                placeholder={t("admin.field.name_ru", "Название (RU)")}
                value={categoryForm.nameRu}
                onChange={(e) =>
                  setCategoryForm((p) => ({ ...p, nameRu: e.target.value }))
                }
                required
              />
              <Input
                type="text"
                placeholder={t("admin.field.name_en", "Название (EN)")}
                value={categoryForm.nameEn}
                onChange={(e) =>
                  setCategoryForm((p) => ({ ...p, nameEn: e.target.value }))
                }
                required
              />
              <Input
                type="number"
                placeholder={t("admin.field.order", "Порядок")}
                value={categoryForm.displayOrder}
                onChange={(e) =>
                  setCategoryForm((p) => ({
                    ...p,
                    displayOrder: e.target.value,
                  }))
                }
              />
              <Textarea
                rows={3}
                placeholder={t(
                  "admin.field.category_svg_icon",
                  "SVG-иконка категории (необязательно)",
                )}
                value={categoryForm.icon}
                onChange={(e) =>
                  setCategoryForm((p) => ({ ...p, icon: e.target.value }))
                }
              />
              <ColorField
                value={categoryForm.iconColor}
                onChange={(iconColor) =>
                  setCategoryForm((p) => ({ ...p, iconColor }))
                }
                placeholder={t(
                  "admin.field.icon_color",
                  "Цвет иконки (#hex, необязательно)",
                )}
              />
              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isSavingCategory}
                >
                  {editingCategoryId === null ?
                    t("admin.action.add", "Добавить")
                  : t("admin.action.save", "Сохранить")}
                </button>
                {editingCategoryId !== null && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={startCategoryCreate}
                  >
                    {t("admin.action.cancel", "Отменить")}
                  </button>
                )}
              </div>
            </form>

            <Separator />

            {categories.length === 0 ?
              <Text size="xs" mode="secondary">
                {t("admin.skills.empty_categories", "Категорий пока нет")}
              </Text>
            : <ul className={styles.list_categories}>
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className={
                      category.id === selectedCategoryId ?
                        `${styles.item} ${styles.itemSelected}`
                      : styles.item
                    }
                  >
                    <button
                      type="button"
                      className={styles.categoryName}
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        startSkillCreate();
                      }}
                    >
                      {category.name?.ru ?? "—"} ({category.id_name})
                    </button>

                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => startCategoryEdit(category)}
                      >
                        {t("admin.action.edit", "Изменить")}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => handleDeleteCategory(category)}
                      >
                        {t("admin.action.delete", "Удалить")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            }
          </div>

          <div className={styles.skills}>
            <Title size="sm">{t("admin.skills.skills", "Навыки")}</Title>
            {!selectedCategoryId ?
              <Text size="xs" mode="secondary">
                {t("admin.skills.select_category", "Выберите категорию слева")}
              </Text>
            : <>
                <form onSubmit={handleSkillSubmit} className={styles.form}>
                  <Input
                    type="text"
                    placeholder={t("admin.field.name_ru", "Название (RU)")}
                    value={skillForm.nameRu}
                    onChange={(e) =>
                      setSkillForm((p) => ({ ...p, nameRu: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="text"
                    placeholder={t("admin.field.name_en", "Название (EN)")}
                    value={skillForm.nameEn}
                    onChange={(e) =>
                      setSkillForm((p) => ({ ...p, nameEn: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="number"
                    placeholder={t("admin.field.order", "Порядок")}
                    value={skillForm.displayOrder}
                    onChange={(e) =>
                      setSkillForm((p) => ({
                        ...p,
                        displayOrder: e.target.value,
                      }))
                    }
                  />
                  <Textarea
                    rows={3}
                    placeholder={t(
                      "admin.field.skill_svg_icon",
                      "SVG-иконка навыка (необязательно)",
                    )}
                    value={skillForm.icon}
                    onChange={(e) =>
                      setSkillForm((p) => ({ ...p, icon: e.target.value }))
                    }
                  />
                  <ColorField
                    value={skillForm.iconColor}
                    onChange={(iconColor) =>
                      setSkillForm((p) => ({ ...p, iconColor }))
                    }
                    placeholder={t(
                      "admin.field.icon_color",
                      "Цвет иконки (#hex, необязательно)",
                    )}
                  />
                  <div className={styles.actions}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={isSavingSkill}
                    >
                      {editingSkillId === null ?
                        t("admin.action.add", "Добавить")
                      : t("admin.action.save", "Сохранить")}
                    </button>
                    {editingSkillId !== null && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={startSkillCreate}
                      >
                        {t("admin.action.cancel", "Отменить")}
                      </button>
                    )}
                  </div>
                </form>
                <Separator />
                {selectedCategorySkills.length === 0 ?
                  <Text size="xs" mode="secondary">
                    {t(
                      "admin.skills.empty_in_category",
                      "В этой категории навыков пока нет",
                    )}
                  </Text>
                : <ul className={styles.list_skills}>
                    {selectedCategorySkills.map((skill) => (
                      <li key={skill.id} className={styles.item}>
                        {skill.skill_icon?.ru && (
                          <div
                            className={styles.skill_icon_wrapper}
                            style={{
                              color: skill.skill_icon_color || undefined,
                            }}
                            dangerouslySetInnerHTML={{
                              __html: skill.skill_icon.ru,
                            }}
                          />
                        )}
                        <div className={styles.skillInfo}>
                          <span className={styles.skillName}>
                            {skill.name?.ru ?? "—"}
                          </span>
                          <span className={styles.skillLevel}>
                            {skill.display_order !== null ?
                              `№${skill.display_order}`
                            : ""}
                          </span>
                        </div>

                        <div className={styles.itemActions}>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => startSkillEdit(skill)}
                          >
                            {t("admin.action.edit", "Изменить")}
                          </button>
                          <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={() => handleDeleteSkill(skill)}
                          >
                            {t("admin.action.delete", "Удалить")}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                }
              </>
            }
          </div>
        </div>
      }
    </section>
  );
};
