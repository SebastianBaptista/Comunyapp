import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import "express-async-errors";
import express from "express";
import http from "http";
import https from "https";
import path from "path";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);
const BACKEND_URL = process.env.PYTHON_BACKEND_URL ?? "http://localhost:8000";
const isProd = process.env.NODE_ENV === "production";

function proxyToPython(req: express.Request, res: express.Response, _next: express.NextFunction) {
  const target = new URL(req.originalUrl, BACKEND_URL);
  const isHttps = target.protocol === "https:";
  const lib = isHttps ? https : http;

  const proxyReq = lib.request(
    {
      hostname: target.hostname,
      port: target.port ? parseInt(target.port) : (isHttps ? 443 : 80),
      path: target.pathname + target.search,
      method: req.method,
      headers: { ...req.headers, host: target.host },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode!, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: `Backend Python no disponible en ${BACKEND_URL}` });
    }
  });

  req.pipe(proxyReq, { end: true });
}

app.all("/api/*", proxyToPython);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

// En Vercel no se llama listen — solo se exporta el app
if (!process.env.VERCEL) {
  if (isProd) {
    const distPath = path.resolve("dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, () => console.log(`  ➜  Local:   http://localhost:${PORT}`));
  } else {
    import("vite").then(async ({ createServer: createViteServer }) => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, () => console.log(`  ➜  Local:   http://localhost:${PORT}`));
    }).catch(console.error);
  }
}

export default app;
