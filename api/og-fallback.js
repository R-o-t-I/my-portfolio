import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  const { slug } = req.query;
  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host ||
    "tihonovich.vercel.app";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${protocol}://${host}`;

  let htmlContent = "";

  try {
    const htmlPath = path.join(process.cwd(), "index.html");
    if (fs.existsSync(htmlPath)) {
      htmlContent = fs.readFileSync(htmlPath, "utf8");
    } else {
      const fallbackLocalPath = path.join(process.cwd(), "dist", "index.html");
      htmlContent = fs.readFileSync(fallbackLocalPath, "utf8");
    }
  } catch (e) {
    console.error("Critical Error reading index.html:", e);
    return res
      .status(500)
      .send("Internal Server Error: Meta-template inaccessible");
  }

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

    const titleRu = project.title?.ru || "Проект";
    const descRu = project.description_mini?.ru || "";
    const image = project.snippet_url || `${baseUrl}/og-image.jpeg`;

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
    console.error("API OG Fallback Error:", err);
    return res.status(200).send(htmlContent);
  }
}
