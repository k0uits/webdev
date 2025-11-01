import fs from "fs";
import path from "path";
import { User } from "../models/userModel";

// __dirname pointe vers src/config. On remonte à data/users.json.
const usersFilePath = path.join(__dirname, "../../data/users.json");

export function readUsers(): User[] {
    const raw = fs.readFileSync(usersFilePath, "utf-8");
    return JSON.parse(raw) as User[];
}

export function findUserByEmail(email: string): User | undefined {
    const users = readUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}
