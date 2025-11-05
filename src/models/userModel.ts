import fs from "fs";
import path from "path";

export interface User {
  id: number;
  nom: string;
  email: string;
  password: string;            // hashé avec bcrypt
  role?: "user" | "admin";
}

export async function updateUserFields(
  id: number,
  nom: string,
  email: string,
  role: "user" | "admin" = "user"
): Promise<boolean> {
  const users = await getUsers();
  const idx = users.findIndex(u => Number(u.id) === Number(id));
  if (idx === -1) return false;

  // email et nom
  users[idx].nom = nom;
  users[idx].email = email;

  // role si fourni
  if (role === "admin" || role === "user") {
    users[idx].role = role;
  }

  await saveUsers(users);
  return true;
}

const usersFilePath = path.join(__dirname, "../../data/users.json");

function ensureFile() {
  const dir = path.dirname(usersFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(usersFilePath)) fs.writeFileSync(usersFilePath, "[]", "utf-8");
}

export async function getUsers(): Promise<User[]> {
  ensureFile();
  const raw = await fs.promises.readFile(usersFilePath, "utf-8");
  try { return JSON.parse(raw) as User[]; } catch { return []; }
}

export async function saveUsers(list: User[]): Promise<void> {
  ensureFile();
  await fs.promises.writeFile(usersFilePath, JSON.stringify(list, null, 2), "utf-8");
}

export async function findUserById(id: number): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => Number(u.id) === Number(id));
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function addUser(newUser: User): Promise<User> {
  const users = await getUsers();
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function updateUserById(id: number, patch: Partial<Pick<User, "nom" | "email">>): Promise<User | null> {
  const users = await getUsers();
  const idx = users.findIndex(u => Number(u.id) === Number(id));
  if (idx === -1) return null;

  if (patch.nom !== undefined) users[idx].nom = patch.nom;
  if (patch.email !== undefined) users[idx].email = patch.email;

  await saveUsers(users);
  return users[idx];
}

export async function setPasswordById(id: number, passwordHash: string): Promise<boolean> {
  const users = await getUsers();
  const idx = users.findIndex(u => Number(u.id) === Number(id));
  if (idx === -1) return false;
  users[idx].password = passwordHash;
  await saveUsers(users);
  return true;
}

export async function removeUserById(id: number): Promise<boolean> {
  const users = await getUsers();
  const next = users.filter(u => Number(u.id) !== Number(id));
  if (next.length === users.length) return false;
  await saveUsers(next);
  return true;
}
