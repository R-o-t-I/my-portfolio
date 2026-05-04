import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "@/styles/global.scss";

import { App } from "./App.tsx";
import { GlobalError, Home, NotFound, Project } from "@/pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <GlobalError />, //доделать её, накинуть стили
    children: [
      {
        index: true, // Это страница по умолчанию (путь "/")
        element: <Home />,
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
