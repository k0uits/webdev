import fs from "fs";
import path from "path";

// --- Définition de la structure d’un utilisateur ---
export interface User {
  id: number;
  nom: string;
  email: string;
  password: string;
  role?: "user" | "admin";
}

// --- Chemin du fichier JSON contenant la liste des utilisateurs ---
const usersFilePath = path.join(__dirname, "../../data/users.json");

// --- Lit et renvoie tous les utilisateurs depuis le fichier JSON ---
export async function getUsers(): Promise<User[]> {
  try {
    const raw = await fs.promises.readFile(usersFilePath, "utf-8");
    return JSON.parse(raw || "[]") as User[];
  } catch {
    return [];
  }
}

// --- Écrit la liste complète des utilisateurs dans le fichier JSON ---
export async function saveUsers(users: User[]): Promise<void> {
  await fs.promises.writeFile(
    usersFilePath,
    JSON.stringify(users, null, 2),
    "utf-8"
  );
}

export async function updateUserName(id: number, nom: string): Promise<boolean> {
  const users = await getUsers();
  const idx = users.findIndex(u => Number(u.id) === Number(id));
  if (idx === -1) return false;
  users[idx].nom = nom;
  await saveUsers(users);
  return true;
}

export async function updateUserFields(id: number, nom: string, email: string, role: string): Promise<boolean> {
  const users = await getUsers();
  const idx = users.findIndex(u => Number(u.id) === Number(id));
  if (idx === -1) return false;
  users[idx].nom = nom;
  users[idx].email = email;
  users[idx].role = role as "user" | "admin";
  await saveUsers(users);
  return true;
}


// --- Recherche un utilisateur par son adresse e-mail (insensible à la casse) ---
export async function findUserByEmail(
  email: string
): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// --- Ajoute un nouvel utilisateur et met à jour le fichier ---
export async function addUser(newUser: User): Promise<User> {
  const users = await getUsers();
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

// --- Supprime un utilisateur par ID et met à jour le fichier ---
export async function removeUserById(id: number): Promise<boolean> {
  const users = await getUsers();
  const next = users.filter((u) => Number(u.id) !== Number(id));
  if (next.length === users.length) return false; // aucun supprimé
  await saveUsers(next);
  return true;
}
