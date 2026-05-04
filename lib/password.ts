const MIN_LENGTH = 8;

/** At least one character from this set (includes @ and &). */
const SYMBOL_RE = /[@&!#$%^*()_+\-=[\]{}|;:,.<>?/~`]/;

export const PASSWORD_SYMBOLS_FOR_DOCS =
  "@&!#$%^*()_+-=[]{}|;:,.<>?/~`";

export function passwordMeetsPolicy(password: string): boolean {
  if (password.length < MIN_LENGTH) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!SYMBOL_RE.test(password)) return false;
  return true;
}

export const passwordPolicyMessage =
  "Password must be at least 8 characters and include letters, numbers, and at least one symbol from @&!#$%^*()_+-=[]{}|;:,.<>?/~`";
