import bcrypt from "bcrypt";
import { db } from "./index.js";
import { notes, users } from "./schema.js";

const BCRYPT_ROUNDS = 10;

// demo@example.com / password123
// alice@example.com / password123
async function seed() {
  try {
    const passwordHash = await bcrypt.hash("password123", BCRYPT_ROUNDS);

    const [demoUser, aliceUser] = await db
      .insert(users)
      .values([
        {
          email: "demo@example.com",
          password: passwordHash,
        },
        {
          email: "alice@example.com",
          password: passwordHash,
        },
      ])
      .returning({ id: users.id, email: users.email });

    const sampleNotes = [
      {
        title: "Primeira nota",
        content: "Este é o conteúdo da primeira nota de exemplo.",
        id_user: demoUser.id,
      },
      {
        title: "Lista de compras",
        content: "Leite, ovos, pão e café.",
        id_user: demoUser.id,
      },
      {
        title: "Ideias",
        content: "Criar uma API simples de notas com Node e TypeScript.",
        id_user: aliceUser.id,
      },
    ];

    await db.insert(notes).values(sampleNotes);

    console.log("Seeded users:");
    console.log(`- ${demoUser.email} / password123`);
    console.log(`- ${aliceUser.email} / password123`);
    console.log(`Seeded ${sampleNotes.length} notes.`);
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
