import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import "express-async-errors";
import { isSupabaseConfigured, supabaseConfigError } from "./lib/env";
import express from "express";
import path from "path";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import coursesRouter from "./routes/courses";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/courses", coursesRouter);

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        if (!isSupabaseConfigured()) {
          console.warn(`⚠️  Supabase: ${supabaseConfigError()}`);
        }
      });
    });
  });
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    if (!isSupabaseConfigured()) {
      console.warn(`⚠️  Supabase: ${supabaseConfigError()}`);
    }
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

export default app;
