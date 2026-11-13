import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export const ProtectedRoute = () => {
  const { isAdmin, isEditor, isLoading } = useAdminAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (isLoading) {
    return (
      <div role="status" aria-live="polite">
        {t("admin.checking_access", "Проверка доступа...")}
      </div>
    );
  }

  // state.from — куда хотел попасть: после входа вернём туда
  return isAdmin || isEditor ?
      <Outlet />
    : <Navigate to="/admin/login" state={{ from: location }} replace />;
};
