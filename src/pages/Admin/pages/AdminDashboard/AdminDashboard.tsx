import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { pluralize, supabase, describeAuditAction } from "@/utils";

import styles from "./AdminDashboard.module.scss";
import { Text, Title } from "@/components";

type Counts = {
  projects: number | null;
  skills: number | null;
  contacts: number | null;
};

type LogEntry = {
  id: string;
  actor_role: string | null;
  action: string;
  table_name: string;
  created_at: string;
};

export const AdminDashboard = () => {
  const [counts, setCounts] = useState<Counts>({
    projects: null,
    skills: null,
    contacts: null,
  });
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const [projectsRes, skillsRes, contactsRes, logsRes] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("skills").select("id", { count: "exact", head: true }),
        supabase.from("contacts").select("id", { count: "exact", head: true }),
        supabase
          .from("admin_audit_log")
          .select("id, actor_role, action, table_name, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (
        projectsRes.error ||
        skillsRes.error ||
        contactsRes.error ||
        logsRes.error
      ) {
        setError("Не удалось загрузить сводку");
        return;
      }

      setCounts({
        projects: projectsRes.count,
        skills: skillsRes.count,
        contacts: contactsRes.count,
      });
      setRecentLogs((logsRes.data as LogEntry[]) ?? []);
    };

    fetchSummary();
  }, []);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section className={styles.wrapper}>
      <Title>Главная</Title>

      {error && <Text className={styles.error}>{error}</Text>}

      <div className={styles.cards}>
        <Link to="/admin/projects" className={styles.card}>
          <Title>{counts.projects ?? "—"}</Title>
          <Text>
            {pluralize(
              Number(counts.projects),
              "проект",
              "проекта",
              "проектов",
            )}
          </Text>
        </Link>

        <Link to="/admin/skills" className={styles.card}>
          <Title>{counts.skills ?? "—"}</Title>
          <Text>
            {pluralize(Number(counts.skills), "навык", "навыка", "навыков")}
          </Text>
        </Link>

        <Link to="/admin/contacts" className={styles.card}>
          <Title>{counts.contacts ?? "—"}</Title>
          <Text>
            {pluralize(Number(counts.contacts), "заявка", "заявки", "заявок")}
          </Text>
        </Link>
      </div>

      <div className={styles.logs}>
        <Title size="sm">Последние действия</Title>

        {recentLogs.length === 0 ?
          <Text size="xs" mode="secondary">
            Журнал пока пуст
          </Text>
        : <ul className={styles.logList}>
            {recentLogs.map((entry) => (
              <li key={entry.id} className={styles.logItem}>
                <span className={styles.logTime}>
                  {formatTime(entry.created_at)}
                </span>
                <span className={styles.logText}>
                  {describeAuditAction(entry.action, entry.table_name)}
                </span>
                <span className={styles.logActor}>
                  {entry.actor_role ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        }

        <Link to="/admin/logs" className={styles.logsLink}>
          <Text size="sm">Весь журнал →</Text>
        </Link>
      </div>
    </section>
  );
};
