import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils";

import styles from "./AdminLoginPage.module.scss";
import { Button, FormItem, Input, Title } from "@/components";

export const AdminLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Разные причины отказа — разные сообщения; вторым аргументом фолбэк на случай отсутствия ключа
  const getAuthErrorMessage = (code?: string): string => {
    switch (code) {
      case "invalid_credentials":
        return t("admin.login.error.credentials", "Неверный email или пароль");
      case "email_not_confirmed":
        return t(
          "admin.login.error.not_confirmed",
          "Подтвердите email перед входом",
        );
      default:
        return t(
          "admin.login.error.generic",
          "Не удалось войти. Попробуйте позже.",
        );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // временно, для диагностики — посмотри, какой code приходит
      console.log("auth error:", authError.code, authError.message);

      setFormError(getAuthErrorMessage(authError.code));
      setIsSubmitting(false);
      return;
    }

    const from = (location.state as { from?: { pathname?: string } })?.from;
    navigate(from?.pathname ?? "/admin", { replace: true });
  };

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Title size="md" align="center">
          {t("admin.login.title", "Панель администратора")}
        </Title>
        <div className={styles.form_group}>
          <FormItem id="email" top={t("admin.login.email", "Email")}>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormError(null); // вводим заново — ошибка гаснет
              }}
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </FormItem>

          <FormItem
            id="password"
            top={t("admin.login.password", "Пароль")}
            error={formError ?? undefined}
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError(null);
              }}
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </FormItem>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ?
            t("admin.login.submitting", "Входим...")
          : t("admin.login.submit", "Войти")}
        </Button>
      </form>
    </div>
  );
};
