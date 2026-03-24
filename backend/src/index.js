/**
 * Local dev / Docker entry point — importa la app y llama listen().
 * En Vercel se usa api/index.js en su lugar.
 */

const app  = require("./app");
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[creditcheck-api] Listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});
