import type { NextFunction, Request, Response } from "express";
import { findUserByToken } from "../services/auth.js";

function extractBearerToken(header: string | undefined) {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = extractBearerToken(req.header("Authorization"));

    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await findUserByToken(token);

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
