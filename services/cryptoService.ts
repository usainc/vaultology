import { StoredVault } from '../types';

// Helper function: Convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper function: Convert Base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

// Derive a key from a master password and salt using PBKDF2
export const deriveKey = async (masterPassword: string, salt: Uint8Array): Promise<CryptoKey> => {
  const masterKeyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 250000, // Increased iterations for better security
      hash: 'SHA-256',
    },
    masterKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// Encrypt data using AES-GCM
// The 'salt' parameter was removed as it's not used directly here; the key is already derived using it.
export const encryptData = async (plaintext: string, key: CryptoKey): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM recommended IV size is 12 bytes
  const encodedText = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // Standard tag length for GCM
    },
    key,
    encodedText
  );
  
  const storedVault: StoredVault = {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext),
  };

  return JSON.stringify(storedVault);
};

// Decrypt data using AES-GCM
// The 'salt' parameter was removed as it's not used directly here; the key is already derived using it.
export const decryptData = async (encryptedVaultJSON: string, key: CryptoKey): Promise<string | null> => {
  try {
    const storedVault: StoredVault = JSON.parse(encryptedVaultJSON);
    const iv = base64ToArrayBuffer(storedVault.iv);
    const ciphertext = base64ToArrayBuffer(storedVault.ciphertext);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // Must match encryption tagLength
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error); // This is the log the user is likely seeing
    return null; // Indicates failure (e.g., wrong key, tampered data)
  }
};