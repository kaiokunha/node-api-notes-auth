import { Router } from "express";
import * as authController from "../controllers/auth.js";
import * as notesController from "../controllers/notes.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";
import {
  createNoteSchema,
  noteIdParamsSchema,
  updateNoteSchema,
} from "../schemas/notes.js";

const router = Router();

router.post(
  "/auth/register",
  validate(registerSchema, "body"),
  authController.register,
);
router.post(
  "/auth/login",
  validate(loginSchema, "body"),
  authController.login,
);

const notesRouter = Router();

notesRouter.use(requireAuth);
notesRouter.post("/", validate(createNoteSchema, "body"), notesController.create);
notesRouter.get("/", notesController.findAll);
notesRouter.get(
  "/:id",
  validate(noteIdParamsSchema, "params"),
  notesController.findById,
);
notesRouter.put(
  "/:id",
  validate(noteIdParamsSchema, "params"),
  validate(updateNoteSchema, "body"),
  notesController.update,
);
notesRouter.delete(
  "/:id",
  validate(noteIdParamsSchema, "params"),
  notesController.remove,
);

router.use("/notes", notesRouter);

export default router;
