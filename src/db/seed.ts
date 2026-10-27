import { db } from "./index.js";
import { notes } from "./schema.js";

const sampleNotes = [
  {
    title: "Primeira nota",
    content: "Este é o conteúdo da primeira nota de exemplo.",
  },
  {
    title: "Lista de compras",
    content: "Leite, ovos, pão e café.",
  },
  {
    title: "Ideias",
    content: "Criar uma API simples de notas com Node e TypeScript.",
  },
];

async function seed() {
  try {
    await db.insert(notes).values(sampleNotes);
    console.log(`Seeded ${sampleNotes.length} notes.`);
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
