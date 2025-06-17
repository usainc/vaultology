export interface StoredVault {
  iv: string; // Base64 encoded IV
  ciphertext: string; // Base64 encoded ciphertext
}

export interface UserInfo {
  username: string;
}

export interface PasswordStrengthCriteria {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialChar: boolean;
}

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password?: string; // Optional during creation if user wants to generate one, but usually present
  website?: string;
  notes?: string;
  // Timestamps can be added if needed: createdAt, updatedAt
}
