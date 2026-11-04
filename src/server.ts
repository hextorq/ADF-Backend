import { app } from "./app.js";
import { env } from "./env.js";

const server = app.listen(env.PORT, () => {
  console.log(`\n========================================`);
  console.log(`  ADF Backend Server is running!       `);
  console.log(`  URL: http://localhost:${env.PORT}   `);
  console.log(`========================================\n`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n[FATAL] Port ${env.PORT} is already in use by another process.`);
    console.error(`To resolve: stop the conflicting process or change PORT in ADF-Backend/.env.\n`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});
