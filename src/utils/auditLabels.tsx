export const OP_LABELS: Record<string, string> = {
  insert: "Создание",
  update: "Изменение",
  delete: "Удаление",
};

export const TABLE_LABELS: Record<string, string> = {
  projects: "проект",
  projects_categories: "категория проекта",
  skills: "навык",
  skills_categories: "категория навыков",
  contacts: "заявка",
  project_skills: "связка проект-навык",
  admin_users: "администратор",
};

export const describeAuditAction = (
  action: string,
  tableName: string,
): string => {
  const op = OP_LABELS[action] ?? action;
  const table = TABLE_LABELS[tableName] ?? tableName;
  return `${op} — ${table}`;
};
