import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notes } from "../db/schema.js";
import type { CreateNoteInput, UpdateNoteInput } from "../schemas/notes.js";

export class NotFoundError extends Error {
  constructor(message = "Note not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function createNote(userId: string, input: CreateNoteInput) {
  try {
    const [note] = await db
      .insert(notes)
      .values({
        ...input,
        id_user: userId,
      })
      .returning();

    return note;
  } catch (error) {
    throw error;
  }
}

export async function findAllNotes(userId: string) {
  try {
    return await db.select().from(notes).where(eq(notes.id_user, userId));
  } catch (error) {
    throw error;
  }
}

export async function findNoteById(userId: string, id: string) {
  try {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.id_user, userId)));

    if (!note) {
      throw new NotFoundError();
    }

    return note;
  } catch (error) {
    throw error;
  }
}

export async function updateNote(
  userId: string,
  id: string,
  input: UpdateNoteInput,
) {
  try {
    const [note] = await db
      .update(notes)
      .set(input)
      .where(and(eq(notes.id, id), eq(notes.id_user, userId)))
      .returning();

    if (!note) {
      throw new NotFoundError();
    }

    return note;
  } catch (error) {
    throw error;
  }
}

export async function deleteNote(userId: string, id: string) {
  try {
    const [note] = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.id_user, userId)))
      .returning();

    if (!note) {
      throw new NotFoundError();
    }
  } catch (error) {
    throw error;
  }
}
