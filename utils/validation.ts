
import { PasswordStrengthCriteria } from '../types';

const MIN_LENGTH = 12;
const HAS_UPPERCASE_REGEX = /[A-Z]/;
const HAS_LOWERCASE_REGEX = /[a-z]/;
const HAS_NUMBER_REGEX = /[0-9]/;
const HAS_SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

export const validatePassword = (password: string): { criteria: PasswordStrengthCriteria; meetsAllCriteria: boolean } => {
  const criteria: PasswordStrengthCriteria = {
    minLength: password.length >= MIN_LENGTH,
    uppercase: HAS_UPPERCASE_REGEX.test(password),
    lowercase: HAS_LOWERCASE_REGEX.test(password),
    number: HAS_NUMBER_REGEX.test(password),
    specialChar: HAS_SPECIAL_CHAR_REGEX.test(password),
  };

  const meetsAllCriteria = Object.values(criteria).every(Boolean);

  return { criteria, meetsAllCriteria };
};
