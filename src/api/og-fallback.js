import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// ИСПРАВЛЕНО: Теперь бэкенд Vercel гарантированно прочитает чистые серверные переменные
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { slug } = req.query;

  try {
    // 1. Делаем быстрый запрос к Supabase для получения данных проекта
    const { data: project, error } = await supabase
      .from("projects")
      .select("title, description_mini, snippet_url")
      .eq("slug", slug)
      .single();

    // Читаем статический index.html из собранного бандла проекта
    const htmlPath = path.join(process.cwd(), "dist", "index.html");
    let htmlContent = fs.readFileSync(htmlPath, "utf8");

    if (error || !project) {
      // Если проект не найден, просто отдаем стандартный index.html
      return res.status(200).send(htmlContent);
    }

    // Извлекаем мультиязычные поля (делаем фолбэк на 'ru', если язык не определен)
    const titleRu = project.title?.ru || "Проект";
    const descRu = project.description_mini?.ru || "";
    const image = project.snippet_url || "https://tihonovich.vercel.app/";

    // 2. На сервере жестко подменяем теги регулярными выражениями до отправки парсеру Telegram
    htmlContent = htmlContent
      .replace(
        /<title>.*?<\/title>/,
        `<title>${titleRu} | Александр Тихонович</title>`,
      )
      .replace(
        /<meta property="og:title" content=".*?"\s*\/?>/,
        `<meta property="og:title" content="${titleRu}" />`,
      )
      .replace(
        /<meta property="og:description" content=".*?"\s*\/?>/,
        `<meta property="og:description" content="${descRu}" />`,
      )
      .replace(
        /<meta property="og:image" content=".*?"\s*\/?>/,
        `<meta property="og:image" content="${image}" />`,
      )
      .replace(
        /<meta name="twitter:title" content=".*?"\s*\/?>/,
        `<meta name="twitter:title" content="${titleRu}" />`,
      )
      .replace(
        /<meta name="twitter:description" content=".*?"\s*\/?>/,
        `<meta name="twitter:description" content="${descRu}" />`,
      )
      .replace(
        /<meta name="twitter:image" content=".*?"\s*\/?>/,
        `<meta name="twitter:image" content="${image}" />`,
      );

    // Отдаем модифицированный HTML мессенджеру или пользователю
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(htmlContent);
  } catch (err) {
    console.error("API OG Fallback Error:", err);
    // При любом сбое отдаем стандартный html, чтобы не ломать сайт пользователям
    try {
      const htmlPath = path.join(process.cwd(), "dist", "index.html");
      return res.status(200).send(fs.readFileSync(htmlPath, "utf8"));
    } catch (e) {
      return res.status(500).send("Internal Server Error");
    }
  }
}
