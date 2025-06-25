import {
  VAULT_USERNAME_KEY,
  VAULT_MP_SALT_KEY,
  VAULT_SA_SALT_KEY,
  VAULT_SECURITY_QUESTION_KEY,
  VAULT_ENCRYPTED_MP_FOR_RECOVERY_KEY,
  VAULT_TEST_PAYLOAD_KEY,
  VAULT_ENTRIES_KEY
} from '../constants';

// Helper function: Convert Uint8Array to Base64 string
const uint8ArrayToBase64 = (array: Uint8Array): string => {
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
};

// Helper function: Convert Base64 string to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Username
export const saveUsername = (username: string): void => localStorage.setItem(VAULT_USERNAME_KEY, username);
export const loadUsername = (): string | null => localStorage.getItem(VAULT_USERNAME_KEY);

// Master Password Salt
export const saveMpSalt = (salt: Uint8Array): void => localStorage.setItem(VAULT_MP_SALT_KEY, uint8ArrayToBase64(salt));
export const loadMpSalt = (): Uint8Array | null => {
  const saltBase64 = localStorage.getItem(VAULT_MP_SALT_KEY);
  return saltBase64 ? base64ToUint8Array(saltBase64) : null;
};

// Security Answer Salt
export const saveSaSalt = (salt: Uint8Array): void => localStorage.setItem(VAULT_SA_SALT_KEY, uint8ArrayToBase64(salt));
export const loadSaSalt = (): Uint8Array | null => {
  const saltBase64 = localStorage.getItem(VAULT_SA_SALT_KEY);
  return saltBase64 ? base64ToUint8Array(saltBase64) : null;
};

// Security Question
export const saveSecurityQuestion = (question: string): void => localStorage.setItem(VAULT_SECURITY_QUESTION_KEY, question);
export const loadSecurityQuestion = (): string | null => localStorage.getItem(VAULT_SECURITY_QUESTION_KEY);

// Encrypted Master Password for Recovery (encrypted with SA-derived key)
export const saveEncryptedMpForRecovery = (encryptedMp: string): void => localStorage.setItem(VAULT_ENCRYPTED_MP_FOR_RECOVERY_KEY, encryptedMp);
export const loadEncryptedMpForRecovery = (): string | null => localStorage.getItem(VAULT_ENCRYPTED_MP_FOR_RECOVERY_KEY);

// Test Payload (encrypted with MP-derived key)
export const saveTestPayload = (encryptedPayload: string): void => localStorage.setItem(VAULT_TEST_PAYLOAD_KEY, encryptedPayload);
export const loadTestPayload = (): string | null => localStorage.getItem(VAULT_TEST_PAYLOAD_KEY);

// Encrypted Password Entries (encrypted with MP-derived key)
export const savePasswordEntries = (encryptedEntries: string): void => localStorage.setItem(VAULT_ENTRIES_KEY, encryptedEntries);
export const loadPasswordEntries = (): string | null => localStorage.getItem(VAULT_ENTRIES_KEY);


export const clearVault = (): void => {
  console.log("[VaultService] Clearing all Vaultology data from localStorage...");
  try {
    localStorage.removeItem(VAULT_USERNAME_KEY);
    localStorage.removeItem(VAULT_MP_SALT_KEY);
    localStorage.removeItem(VAULT_SA_SALT_KEY);
    localStorage.removeItem(VAULT_SECURITY_QUESTION_KEY);
    localStorage.removeItem(VAULT_ENCRYPTED_MP_FOR_RECOVERY_KEY);
    localStorage.removeItem(VAULT_TEST_PAYLOAD_KEY);
    localStorage.removeItem(VAULT_ENTRIES_KEY); // Clear password entries as well
    console.log("[VaultService] Successfully cleared all Vaultology keys from localStorage.");
  } catch (e) {
    console.error("[VaultService] Error clearing Vaultology data from localStorage:", e);
  }
};
