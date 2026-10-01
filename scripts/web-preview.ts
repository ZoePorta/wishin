/**
 * Builds the web client as a static export and serves it so it can be tested
 * from other devices, optionally behind a public HTTPS Cloudflare quick tunnel.
 *
 * Usage:
 *   pnpm web:preview                 # build + serve + tunnel
 *   pnpm web:preview --skip-build    # reuse the existing dist/
 *   pnpm web:preview --no-tunnel     # LAN only (http, no PWA install prompt)
 *
 * The root `.env` is loaded explicitly because `expo export` evaluates
 * `app.config.ts` before loading `.env`, which makes it throw on the missing
 * `EXPO_PUBLIC_APPWRITE_PROJECT_ID`.
 *
 * The tunnel hostname (`*.trycloudflare.com`) must be registered as a Web
 * platform in the Appwrite console, otherwise requests fail with CORS errors.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptsDir, "..");
const distDir = path.resolve(workspaceRoot, "apps/expo-client/dist");
const port = process.env.PORT ?? "3000";

const args = new Set(process.argv.slice(2));
const skipBuild = args.has("--skip-build");
const useTunnel = !args.has("--no-tunnel");

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

loadEnv({ path: path.resolve(workspaceRoot, ".env"), quiet: true });

if (!skipBuild) {
  if (!process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID) {
    console.error("Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID in the root .env");
    process.exit(1);
  }
  execFileSync(
    "pnpm",
    [
      "--filter",
      "@wishin/expo-client",
      "exec",
      "expo",
      "export",
      "--platform",
      "web",
    ],
    { stdio: "inherit", cwd: workspaceRoot, env: process.env },
  );
}

if (!existsSync(path.join(distDir, "index.html"))) {
  console.error(`No build found in ${distDir}. Run without --skip-build.`);
  process.exit(1);
}

/**
 * Resolves a request path to a file inside dist/, falling back to index.html
 * so client-side routes (e.g. /wishlist/123) work on reload.
 */
function resolveFile(urlPath: string): string {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = path.resolve(distDir, `.${decoded}`);
  if (!candidate.startsWith(distDir)) return path.join(distDir, "index.html");
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  if (existsSync(`${candidate}.html`)) return `${candidate}.html`;
  return path.join(distDir, "index.html");
}

const server = createServer((req, res) => {
  const file = resolveFile(req.url ?? "/");
  res.writeHead(200, {
    "Content-Type":
      CONTENT_TYPES[path.extname(file).toLowerCase()] ??
      "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  createReadStream(file).pipe(res);
});

let tunnel: ChildProcess | undefined;

server.listen(Number(port), "0.0.0.0", () => {
  console.log(`\nServing ${path.relative(workspaceRoot, distDir)}/`);
  console.log(`  Local: http://localhost:${port}`);
  for (const iface of Object.values(networkInterfaces()).flat()) {
    if (iface?.family === "IPv4" && !iface.internal) {
      console.log(`  LAN:   http://${iface.address}:${port}`);
    }
  }

  if (!useTunnel) return;

  console.log("\nStarting Cloudflare tunnel...");
  tunnel = spawn(
    "npx",
    ["-y", "cloudflared", "tunnel", "--url", `http://localhost:${port}`],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let announced = false;
  const onOutput = (chunk: Buffer): void => {
    const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(
      chunk.toString(),
    );
    if (match && !announced) {
      announced = true;
      console.log(`  Public: ${match[0]}\n`);
    }
  };
  tunnel.stdout?.on("data", onOutput);
  tunnel.stderr?.on("data", onOutput);
  tunnel.on("exit", (code) => {
    if (code) console.error(`cloudflared exited with code ${String(code)}`);
  });
});

const shutdown = (): void => {
  tunnel?.kill();
  server.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
