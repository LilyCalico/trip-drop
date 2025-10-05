import { createHash, randomBytes } from "node:crypto";

/**
 * パスワードをハッシュ化（ソルト付き）
 * @param password 平文パスワード
 * @returns ソルト:ハッシュの形式
 */
export function hashPassword(password: string): string {
  // ソルトを生成（32バイト）
  const salt = randomBytes(32).toString("hex");

  // パスワード+ソルトをhash化
  const hashedPassword = createHash("sha256")
    .update(password + salt)
    .digest("hex");

  // ソルトとハッシュを結合
  return `${salt}:${hashedPassword}`;
}

/**
 * パスワードを検証
 * @param password 平文パスワード
 * @param hashedPassword ハッシュ化されたパスワード（ソルト:ハッシュ形式）
 * @returns 一致するかどうか
 */
export function verifyPassword(
  password: string,
  hashedPassword: string
): boolean {
  const [salt, hash] = hashedPassword.split(":");

  if (!salt || !hash) {
    return false;
  }

  // 入力パスワード+ソルトをhash化
  const inputHash = createHash("sha256")
    .update(password + salt)
    .digest("hex");

  return inputHash === hash;
}
