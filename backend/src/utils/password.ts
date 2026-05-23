import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = (password: string, hashedPassword: string) =>
  bcrypt.compare(password, hashedPassword);
