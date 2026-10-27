import express from "express";
import routes from "./routes/main.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(routes);

  return app;
}
