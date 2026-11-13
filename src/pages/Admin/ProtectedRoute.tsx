import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export const ProtectedRoute = () => {
  const { isAdmin, isEditor, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Проверка доступа...</div>; // вынеси в отдельный лоадер
  }

  // state.from — куда хотел попасть: после входа вернём туда
  return isAdmin || isEditor ?
      <Outlet />
    : <Navigate to="/admin/login" state={{ from: location }} replace />;
};
