import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// === ХЕЛПЕРЫ (на уровне модуля, вне handler) ===

const escapeHtml = (s = "") =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// Замена мета-тега, нечувствительная к переносам строк и порядку атрибутов
const setMeta = (html, attr, key, content) => {
  const re = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*>`, "i");
  return html.replace(
    re,
    () => `<meta ${attr}="${key}" content="${content}" />`,
  );
};

// Локализованные поля могут прийти строкой или JSON-объектом {ru, en}
const pick = (v) =>
  v ?
    typeof v === "string" ?
      v
    : v.ru || v.en || ""
  : "";

const getTemplatePath = () => {
  const candidates = [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(__dirname, "dist", "index.html"),
    path.join(process.cwd(), "index.html"),
    path.join(__dirname, "index.html"),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
};

export default async function handler(req, res) {
  const { slug } = req.query;
  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host ||
    "tihonovich.vercel.app";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${protocol}://${host}`;

  // === ЧТЕНИЕ ШАБЛОНА: сначала собранный dist, потом исходник ===
  const templatePath = getTemplatePath();
  if (!templatePath) {
    console.error("Meta-template not found in function bundle");
    return res
      .status(500)
      .send("Internal Server Error: Meta-template inaccessible");
  }
  const htmlContent = fs.readFileSync(templatePath, "utf8");

  if (!supabase) {
    return res.status(200).send(htmlContent);
  }

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select("title, description_mini, snippet_url")
      .eq("slug", slug)
      .single();

    if (error || !project) {
      return res.status(200).send(htmlContent);
    }

    const title = escapeHtml(pick(project.title) || "Проект");
    const desc = escapeHtml(pick(project.description_mini));
    const image = escapeHtml(
      pick(project.snippet_url) || `${baseUrl}/og-image.jpeg`,
    );

    let html = htmlContent;
    html = html.replace(
      /<title>.*?<\/title>/,
      () => `<title>${title} | Александр Тихонович</title>`,
    );
    html = setMeta(html, "property", "og:title", title);
    html = setMeta(html, "property", "og:description", desc);
    html = setMeta(html, "property", "og:image", image);
    html = setMeta(html, "name", "twitter:title", title);
    html = setMeta(html, "name", "twitter:description", desc);
    html = setMeta(html, "name", "twitter:image", image);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("API OG Fallback Error:", err);
    return res.status(200).send(htmlContent);
  }
}
