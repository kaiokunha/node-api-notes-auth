import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notes } from "../db/schema.js";
import type { CreateNoteInput, UpdateNoteInput } from "../schemas/notes.js";

export class NotFoundError extends Error {
  constructor(message = "Note not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function createNote(input: CreateNoteInput) {
  try {
    const [note] = await db.insert(notes).values(input).returning();
    return note;
  } catch (error) {
    throw error;
  }
}

export async function findAllNotes() {
  try {
    return await db.select().from(notes);
  } catch (error) {
    throw error;
  }
}

export async function findNoteById(id: string) {
  try {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));

    if (!note) {
      throw new NotFoundError();
    }

    return note;
  } catch (error) {
    throw error;
  }
}

export async function updateNote(id: string, input: UpdateNoteInput) {
  try {
    const [note] = await db
      .update(notes)
      .set(input)
      .where(eq(notes.id, id))
      .returning();

    if (!note) {
      throw new NotFoundError();
    }

    return note;
  } catch (error) {
    throw error;
  }
}

export async function deleteNote(id: string) {
  try {
    const [note] = await db
      .delete(notes)
      .where(eq(notes.id, id))
      .returning();

    if (!note) {
      throw new NotFoundError();
    }
  } catch (error) {
    throw error;
  }
}
