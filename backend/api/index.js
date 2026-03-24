/**
 * Vercel serverless entry point.
 * Vercel importa este módulo y llama al handler por cada request —
 * nunca llama a listen(), por eso exportamos la app directamente.
 */
const app = require("../src/app");
module.exports = app;
