import bcrypt from 'bcrypt';

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const comparePassword = async (password: string, hashed: string) =>
  bcrypt.compare(password, hashed);
