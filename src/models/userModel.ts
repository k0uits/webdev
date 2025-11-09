// src/models/userModel.ts
import fs from "fs";
import path from "path";

export interface User {
  id: string;
  nom: string;
  email: string;
  password: string;
  role?: "user" | "admin";
  points?: number;
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
  const arr: any[] = raw.trim() ? JSON.parse(raw) : [];
  return arr.map(u => ({ ...u, id: String(u.id), points: Number(u.points || 0) })) as User[];
}

export async function saveUsers(list: User[]): Promise<void> {
  ensureFile();
  const norm = list.map(u => ({ ...u, id: String(u.id), points: Number(u.points || 0) }));
  await fs.promises.writeFile(usersFilePath, JSON.stringify(norm, null, 2), "utf-8");
}

export async function findUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => String(u.id) === String(id));
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => (u.email || "").toLowerCase() === (email || "").toLowerCase());
}

export async function addUser(newUser: User): Promise<User> {
  const users = await getUsers();
  users.push({ ...newUser, id: String(newUser.id), points: Number(newUser.points || 0) });
  await saveUsers(users);
  return newUser;
}

export async function updateUserById(
  id: string,
  patch: Partial<Pick<User, "nom" | "email" | "role">>
): Promise<User | null> {
  const users = await getUsers();
  const idx = users.findIndex(u => String(u.id) === String(id));
  if (idx === -1) return null;
  if (patch.nom !== undefined) users[idx].nom = patch.nom;
  if (patch.email !== undefined) users[idx].email = patch.email;
  if (patch.role === "user" || patch.role === "admin") users[idx].role = patch.role;
  await saveUsers(users);
  return users[idx];
}

export async function setPasswordById(id: string, passwordHash: string): Promise<boolean> {
  const users = await getUsers();
  const idx = users.findIndex(u => String(u.id) === String(id));
  if (idx === -1) return false;
  users[idx].password = passwordHash;
  await saveUsers(users);
  return true;
}

export async function removeUserById(id: string): Promise<boolean> {
  const users = await getUsers();
  const next = users.filter(u => String(u.id) !== String(id));
  if (next.length === users.length) return false;
  await saveUsers(next);
  return true;
}

/** ✅ version asynchrone : ajoute des points et SAUVE */
export async function addPoints(userId: string, delta: number): Promise<User | null> {
  const users = await getUsers();
  const idx = users.findIndex(u => String(u.id) === String(userId));
  if (idx < 0) return null;
  const before = Number(users[idx].points || 0);
  users[idx].points = before + Number(delta || 0);
  await saveUsers(users);            // <<— écrit vraiment dans users.json
  return users[idx];
}
