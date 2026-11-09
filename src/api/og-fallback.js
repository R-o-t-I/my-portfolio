import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Кросплатформенный сбор переменных с бэкенда Vercel
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  const { slug } = req.query;

  // ИСПРАВЛЕНО ДЛЯ VERCEL: В продакшене папка dist компилируется прямо в корень деплоя,
  // поэтому файл index.html ищется непосредственно в корневом каталоге процесса
  const htmlPath = path.join(process.cwd(), "index.html");
  let htmlContent = "";

  try {
    htmlContent = fs.readFileSync(htmlPath, "utf8");
  } catch (e) {
    console.error("Failed to read index.html from root folder:", e);
    return res
      .status(500)
      .send("Internal Server Error: Static HTML template not found");
  }

  // Если клиент базы данных не инициализировался, отдаем стандартную страницу
  if (!supabase) {
    console.error(
      "Supabase client failed to initialize. Check your Environment Variables on Vercel.",
    );
    return res.status(200).send(htmlContent);
  }

  try {
    // 1. Делаем быстрый запрос к Supabase для получения данных проекта
    const { data: project, error } = await supabase
      .from("projects")
      .select("title, description_mini, snippet_url")
      .eq("slug", slug)
      .single();

    if (error || !project) {
      console.warn(`Project with slug "${slug}" not found in Supabase:`, error);
      return res.status(200).send(htmlContent);
    }

    const titleRu = project.title?.ru || "Проект";
    const descRu = project.description_mini?.ru || "";
    const image = project.snippet_url || "https://vercel.app";

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

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(htmlContent);
  } catch (err) {
    console.error("API OG Fallback Error during generation:", err);
    return res.status(200).send(htmlContent);
  }
}
