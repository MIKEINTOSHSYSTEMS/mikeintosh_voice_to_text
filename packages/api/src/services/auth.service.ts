import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { ConflictError, UnauthorizedError, NotFoundError } from "../lib/errors.js";
import type { RegisterInput, LoginInput } from "../validation/auth.js";

const SALT_ROUNDS = 12;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return user;
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  return { id: user.id, email: user.email, name: user.name };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw new NotFoundError("User");
  return user;
}
