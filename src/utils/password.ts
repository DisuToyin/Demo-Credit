import { randomBytes, scrypt } from "node:crypto";

const scryptBuffer = (
  password: string,
  salt: string,
  keyLength: number
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptBuffer(password, salt, 64);

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
};
