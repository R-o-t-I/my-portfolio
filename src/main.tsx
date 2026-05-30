import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <React.Suspense fallback={<Loading />}>
        <App />
      </React.Suspense>
    ),
    errorElement: <GlobalError />, //доделать её, накинуть стили
    children: [
      {
        index: true, // Это страница по умолчанию (путь "/")
        element: <Home />,
      },
      {
        path: "projects",
        element: <Projects />,
      },
      {
        path: "project/:id",
        element: <Project />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
