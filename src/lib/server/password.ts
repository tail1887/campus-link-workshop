import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_KEY = "scrypt";
const SALT_BYTES = 16;
const HASH_BYTES = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = scryptSync(password, salt, HASH_BYTES).toString("hex");

  return `${HASH_KEY}:${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split(":");

  if (algorithm !== HASH_KEY || !salt || !storedHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, HASH_BYTES);
  const storedBuffer = Buffer.from(storedHash, "hex");

  return (
    storedBuffer.length === derivedHash.length &&
    timingSafeEqual(storedBuffer, derivedHash)
  );
}
