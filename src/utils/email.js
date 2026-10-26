// Keep signup, profile storage and login on the same email representation.
export const normalizeEmail = (email) => (
  typeof email === 'string' ? email.trim().toLowerCase() : ''
);
