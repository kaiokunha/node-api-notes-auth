import { Router } from "express";
import * as notesController from "../controllers/notes.js";
import { validate } from "../middlewares/validate.js";
import {
  createNoteSchema,
  noteIdParamsSchema,
  updateNoteSchema,
} from "../schemas/notes.js";

const router = Router();

router.post("/notes", validate(createNoteSchema, "body"), notesController.create);
router.get("/notes", notesController.findAll);
router.get(
  "/notes/:id",
  validate(noteIdParamsSchema, "params"),
  notesController.findById,
);
router.put(
  "/notes/:id",
  validate(noteIdParamsSchema, "params"),
  validate(updateNoteSchema, "body"),
  notesController.update,
);
router.delete(
  "/notes/:id",
  validate(noteIdParamsSchema, "params"),
  notesController.remove,
);

export default router;
