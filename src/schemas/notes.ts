import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const noteIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
