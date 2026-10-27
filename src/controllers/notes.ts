import type { Request, Response } from "express";
import * as notesService from "../services/notes.js";
import { NotFoundError } from "../services/notes.js";
import type { CreateNoteInput, UpdateNoteInput } from "../schemas/notes.js";

export async function create(req: Request, res: Response) {
  try {
    const body = req.body as CreateNoteInput;
    const note = await notesService.createNote(body);
    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function findAll(_req: Request, res: Response) {
  try {
    const notes = await notesService.findAllNotes();
    res.status(200).json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function findById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const note = await notesService.findNoteById(id);
    res.status(200).json(note);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateNoteInput;
    const note = await notesService.updateNote(id, body);
    res.status(200).json(note);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    await notesService.deleteNote(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
