import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createMiddleware() {
  const LIVERELOAD_PORT = process.env.LIVERELOAD_PORT;
  return connectLiveReload({ port: LIVERELOAD_PORT });
}

export function startServer() {
  // Skip livereload in test environment
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const LIVERELOAD_PORT = process.env.LIVERELOAD_PORT;
  const HOST = process.env.HOST || "localhost";

  const liveReloadServer = livereload.createServer({
    port: LIVERELOAD_PORT,
    host: HOST === "0.0.0.0" ? "0.0.0.0" : "127.0.0.1",
    exts: ["html", "css", "js", "pug"],
    delay: 50,
  });

  liveReloadServer.watch(path.join(__dirname, "../"));

  liveReloadServer.server.once("connection", () => {
    console.log("✅ LiveReload client connected");
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });

  liveReloadServer.on("change", (filePath) => {
    console.log("🔄 File changed:", filePath);
  });

  console.log(`🔥 LiveReload server running on port ${LIVERELOAD_PORT}`);
}
