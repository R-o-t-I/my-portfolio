import React, { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import "./i18n.tsx";

import "@/styles/global.scss";

import { App } from "./App.tsx";
import {
  GlobalError,
  Home,
  Loading,
  NotFound,
  Project,
  Projects,
} from "@/pages";

import {
  AdminLayout,
  AdminLoginPage,
  AdminDashboard,
  AdminProjects,
  AdminSkills,
  AdminContacts,
  AdminLogs,
  ProtectedRoute,
} from "@/pages/Admin";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    ),
    errorElement: <GlobalError />, // TODO: накинуть стили
    children: [
      { index: true, element: <Home /> },
      { path: "projects", element: <Projects /> },
      { path: "project/:id", element: <Project /> },
      // Явный маршрут для программной навигации на 404
      // (из Project.tsx при несуществующем slug)
      { path: "404", element: <NotFound /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  {
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "projects", element: <AdminProjects /> },
          { path: "skills", element: <AdminSkills /> },
          { path: "contacts", element: <AdminContacts /> },
          { path: "logs", element: <AdminLogs /> },
          // Неизвестные админ-пути — на дашборд, а не пустой сайдбар
          { path: "*", element: <Navigate to="/admin" replace /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
