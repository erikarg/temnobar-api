import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../database/prisma.js";
import { env } from "../../lib/env.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../lib/errors.js";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";

export async function register(data: {
  email: string;
  password: string;
  name: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password_hash,
      name: data.name,
      bar_id: null,
    },
  });

  const token = signToken(user.id, user.bar_id);
  return { user: publicUser(user), token };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = signToken(user.id, user.bar_id);
  return { user: publicUser(user), token };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      bar_id: true,
      created_at: true,
    },
  });
  return user;
}

// bar_id na resposta: sem ele o app manda para a seleção de bar a cada login.
function publicUser(user: {
  id: string;
  email: string;
  name: string;
  bar_id: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    bar_id: user.bar_id,
  };
}

function signToken(userId: string, barId: string | null) {
  return jwt.sign({ sub: userId, bar_id: barId }, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export async function updateUser(userId: string, barId: string) {
  const bar = await prisma.bar.findUnique({
    where: { id: barId },
  });

  if (!bar) {
    throw new NotFoundError("Bar not found");
  }

  // select explicito: o retorno cru do Prisma inclui password_hash.
  const user = await prisma.user.update({
    where: { id: userId },
    data: { bar_id: barId },
    select: { id: true, email: true, name: true, bar_id: true },
  });

  // Token reemitido para a claim bar_id nao ficar defasada ate expirar.
  const token = signToken(user.id, user.bar_id);

  return { user, token };
}
