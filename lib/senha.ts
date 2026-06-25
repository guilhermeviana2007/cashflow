import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Hash de senha com scrypt (embutido no Node, sem dependências nativas).
// Formato guardado: "<salt em hex>:<hash em hex>".
export function hashSenha(senha: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

// Verifica a senha contra o hash guardado, em tempo constante.
export function verificarSenha(senha: string, armazenado: string): boolean {
  const [saltHex, hashHex] = armazenado.split(":");
  if (!saltHex || !hashHex) return false;
  const hashGuardado = Buffer.from(hashHex, "hex");
  const novoHash = scryptSync(senha, Buffer.from(saltHex, "hex"), 64);
  return (
    hashGuardado.length === novoHash.length &&
    timingSafeEqual(hashGuardado, novoHash)
  );
}
