import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
};

export const verifyPassword = (plain, hash) => {
  return bcrypt.compare(plain, hash);
};
