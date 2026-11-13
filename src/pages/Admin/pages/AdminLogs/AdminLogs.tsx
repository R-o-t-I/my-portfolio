import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { supabase } from "@/utils";
import { describeAuditAction } from "@/utils/auditLabels";

import styles from "./AdminLogs.module.scss";
import { Text, Title } from "@/components";

type Localized = { ru?: string; en?: string } | null;

type LogEntry = {
  id: string;
  actor_role: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  record_label: string | null; // снапшот имени из базы
  changed_fields: Record<string, unknown> | null;
  created_at: string;
};

// Извлекаем человекочитаемое имя из строки таблицы.
// Для таблиц, которых нет в списке, имена не запрашиваем — покажем сырое "#id".
const LABEL_EXTRACTORS: Record<
  string,
  (row: Record<string, unknown>) => string | null
> = {
  projects: (row) => {
    const title = (row.title as Localized) ?? null;
    const slug = row.slug as string | null;
    return title?.ru || title?.en || slug || null;
  },
  skills: (row) => {
    const name = (row.name as Localized) ?? null;
    return name?.ru || name?.en || null;
  },
  projects_categories: (row) => {
    const name = (row.name as Localized) ?? null;
    return name?.ru || name?.en || (row.slug as string | null) || null;
  },
  skills_categories: (row) => {
    const name = (row.name as Localized) ?? null;
    return name?.ru || name?.en || null;
  },
  admin_users: (row) => (row.email as string | null) ?? null,
  contacts: (row) =>
    (row.name as string | null) ?? (row.email as string | null) ?? null,
};

const loadDisplayNames = async (
  logs: LogEntry[],
): Promise<Map<string, string>> => {
  // Собираем id по таблицам: одна таблица — один запрос вместо запроса на строку
  const idsByTable = new Map<string, Set<string>>();

  // Для связок проект-навык record_id — составной: "projectId:skillId".
  // Имя собираем из названий обеих таблиц
  const linkPairs = new Map<string, { projectId: string; skillId: string }>();

  for (const entry of logs) {
    if (!entry.record_id) continue;

    if (entry.table_name === "project_skills") {
      const [projectId, skillId] = entry.record_id.split(":");
      if (projectId && skillId) {
        linkPairs.set(entry.record_id, { projectId, skillId });
      }
      continue;
    }

    if (!LABEL_EXTRACTORS[entry.table_name]) continue;

    const ids = idsByTable.get(entry.table_name) ?? new Set();
    ids.add(entry.record_id);
    idsByTable.set(entry.table_name, ids);
  }

  const names = new Map<string, string>();

  await Promise.all(
    [...idsByTable.entries()].map(async ([table, ids]) => {
      const { data } = await supabase
        .from(table)
        .select("*")
        .in("id", [...ids]);

      for (const row of ((data ?? []) as Record<string, unknown>[]) || []) {
        const label = LABEL_EXTRACTORS[table](row);
        if (label) names.set(`${table}:${String(row.id)}`, label);
      }
    }),
  );

  // Связки: вытягиваем названия проектов и навыков, склеиваем «проект — навык»
  if (linkPairs.size > 0) {
    const projectIds = [
      ...new Set([...linkPairs.values()].map((p) => p.projectId)),
    ];
    const skillIds = [
      ...new Set([...linkPairs.values()].map((p) => p.skillId)),
    ];

    const [projectsRes, skillsRes] = await Promise.all([
      supabase.from("projects").select("id, title, slug").in("id", projectIds),
      supabase.from("skills").select("id, name").in("id", skillIds),
    ]);

    const projectLabel = new Map<string, string>();
    for (const row of ((projectsRes.data ?? []) as Record<string, unknown>[]) ||
      []) {
      const label = LABEL_EXTRACTORS.projects(row);
      if (label) projectLabel.set(String(row.id), label);
    }

    const skillLabel = new Map<string, string>();
    for (const row of ((skillsRes.data ?? []) as Record<string, unknown>[]) ||
      []) {
      const label = LABEL_EXTRACTORS.skills(row);
      if (label) skillLabel.set(String(row.id), label);
    }

    for (const [recordId, pair] of linkPairs) {
      // Если имя не нашлось (запись удалена) — показываем короткий кусок id
      const project =
        projectLabel.get(pair.projectId) ?? pair.projectId.slice(0, 8);
      const skill = skillLabel.get(pair.skillId) ?? pair.skillId.slice(0, 8);
      names.set(`project_skills:${recordId}`, `${project} — ${skill}`);
    }
  }

  return names;
};

// Короткое представление значения: строки обрезаем,
// jsonb с ru/en показываем ru, прочие объекты сворачиваем.
// full = true — ячейка раскрыта, показываем значение целиком без обрезки
const summarizeValue = (value: unknown, full = false): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    return full || value.length <= 24 ? value : `${value.slice(0, 24)}…`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.ru === "string") {
      return full || obj.ru.length <= 24 ? obj.ru : `${obj.ru.slice(0, 24)}…`;
    }
    return full ? JSON.stringify(obj) : "{…}";
  }
  return String(value);
};

type FieldChange = { field: string; from: string; to: string };

const extractFieldChanges = (
  changed: Record<string, unknown> | null,
  full: boolean,
): FieldChange[] => {
  if (!changed) return [];

  // Обёртка { new: {...}, old: {...} } — как пишет триггер аудита
  if ("new" in changed || "old" in changed) {
    const newRow = (changed.new ?? null) as Record<string, unknown> | null;
    const oldRow = (changed.old ?? null) as Record<string, unknown> | null;

    // insert: old нет; delete: new нет — показываем поля записи
    if (!newRow || !oldRow) {
      return Object.keys(newRow ?? oldRow ?? {}).map((field) => ({
        field,
        from: "—",
        to: "—",
      }));
    }

    return Object.keys(newRow)
      .filter(
        (field) =>
          JSON.stringify(oldRow[field]) !== JSON.stringify(newRow[field]),
      )
      .map((field) => ({
        field,
        from: summarizeValue(oldRow[field], full),
        to: summarizeValue(newRow[field], full),
      }));
  }

  // Запасной вариант: диф лежит плоско { field: value }
  return Object.keys(changed).map((field) => ({
    field,
    from: "—",
    to: summarizeValue(changed[field], full),
  }));
};

const describeChanges = (
  entry: LogEntry,
  t: TFunction,
  full: boolean,
): string => {
  if (entry.action !== "update") return "—";

  const changes = extractFieldChanges(entry.changed_fields, full);
  if (changes.length === 0) return "—";

  return changes
    .map(({ field, from, to }) => {
      // Название поля из локали, незнакомые — как есть
      const label = t(`admin.audit.fields.${field}`, field);
      return from !== "—" ? `${label}: ${from} → ${to}` : label;
    })
    .join(", ");
};

export const AdminLogs = () => {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Раскрытые ячейки. Ключ составной: "id:object" или "id:changes",
  // чтобы «Объект» и «Изменённые поля» раскрывались независимо
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);

      const { data, error: fetchError } = await supabase
        .from("admin_audit_log")
        .select(
          "id, actor_role, action, table_name, record_id, record_label, changed_fields, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (fetchError) {
        setError(t("admin.logs.error", "Не удалось загрузить журнал"));
        setIsLoading(false);
        return;
      }

      const logs = (data as LogEntry[]) ?? [];
      setEntries(logs);
      setIsLoading(false);

      // Имена догружаем фоном: таблица рисуется сразу, названия подтекут следом
      const displayNameMap = await loadDisplayNames(logs);
      setNames(displayNameMap);
    };

    fetchLogs();
    // Загружаем один раз: t в зависимостях заставлял бы перезапрашивать
    // 200 записей при каждой смене языка
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatObject = (entry: LogEntry): { label: string; full: string } => {
    const raw =
      entry.record_id !== null ?
        `${entry.table_name} #${entry.record_id}`
      : entry.table_name;

    if (!entry.record_id) return { label: entry.table_name, full: raw };

    const name =
      entry.record_label ?? names.get(`${entry.table_name}:${entry.record_id}`);
    return { label: name ?? raw, full: raw };
  };

  return (
    <section className={styles.wrapper}>
      <Title>{t("admin.logs.title", "Журнал действий")}</Title>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ?
        <Text size="xs" mode="secondary">
          {t("admin.logs.loading", "Загружаем...")}
        </Text>
      : entries.length === 0 ?
        <Text size="xs" mode="secondary">
          {t("admin.logs.empty", "Журнал пока пуст")}
        </Text>
      : <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.logs.col.time", "Время")}</th>
              <th>{t("admin.logs.col.role", "Роль")}</th>
              <th>{t("admin.logs.col.action", "Действие")}</th>
              <th>{t("admin.logs.col.object", "Объект")}</th>
              <th>{t("admin.logs.col.changed_fields", "Изменённые поля")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const object = formatObject(entry);
              const isObjectExpanded = expanded.has(`${entry.id}:object`);
              const isChangesExpanded = expanded.has(`${entry.id}:changes`);

              return (
                <tr key={entry.id}>
                  <td className={styles.time}>
                    {formatTime(entry.created_at)}
                  </td>
                  <td>{entry.actor_role ?? "—"}</td>
                  <td>
                    {describeAuditAction(entry.action, entry.table_name, t)}
                  </td>
                  <td
                    className={
                      isObjectExpanded ?
                        `${styles.changes} ${styles.changesExpanded}`
                      : styles.changes
                    }
                    title={object.full}
                    onClick={() => toggleExpanded(`${entry.id}:object`)}
                  >
                    {isObjectExpanded ? object.full : object.label}
                  </td>
                  <td
                    className={
                      isChangesExpanded ?
                        `${styles.changes} ${styles.changesExpanded}`
                      : styles.changes
                    }
                    title={describeChanges(entry, t, isChangesExpanded)}
                    onClick={() => toggleExpanded(`${entry.id}:changes`)}
                  >
                    {describeChanges(entry, t, isChangesExpanded)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </section>
  );
};
