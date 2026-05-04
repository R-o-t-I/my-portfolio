import React from "react";
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

import styles from "./GlobalError.module.scss";

export const GlobalError = ({}) => {
  const error = useRouteError();
  console.error(error); // Для отладки в консоли

  let errorMessage: string;

  if (isRouteErrorResponse(error)) {
    // Ошибки роутинга (404, 401, 500 и т.д.)
    errorMessage =
      error.statusText || error.data?.message || "Страница не найдена";
  } else if (error instanceof Error) {
    // Ошибки самого JS кода
    errorMessage = error.message;
  } else {
    errorMessage = "Неизвестная ошибка";
  }

  return (
    <div className={styles.wrapper}>
      <h1>Упс! Что-то пошло не так</h1>
      <p className="error-details">
        <i>{errorMessage}</i>
      </p>
      <Link to="/" className="btn-glass">
        На главную
      </Link>
    </div>
  );
};
