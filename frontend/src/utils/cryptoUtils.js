import CryptoJS from 'crypto-js';

// In a real E2EE app, this secret would be a combination of user's private key 
// and the recipient's public key (Diffie-Hellman).
// For this implementation, we use a derived key from the chatId to demonstrate the E2EE flow.
const SECRET_SALT = 'pingme-e2ee-v1';

export const encryptMessage = (text, chatId) => {
  if (!text || !chatId) return text;
  try {
    // We derive the encryption key from the chatId and our secret salt
    const encryptionKey = `${chatId}-${SECRET_SALT}`;
    return CryptoJS.AES.encrypt(text, encryptionKey).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
};

export const decryptMessage = (encryptedText, chatId) => {
  if (!encryptedText || !chatId) return encryptedText;
  
  // If it's not actually encrypted (e.g. legacy messages), return as is
  if (!encryptedText.startsWith('U2FsdGVkX1')) {
    return encryptedText;
  }

  try {
    const encryptionKey = `${chatId}-${SECRET_SALT}`;
    const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) return '[Decryption Error]';
    return decryptedText;
  } catch (error) {
    // console.error('Decryption failed:', error);
    return encryptedText; // Return encrypted if decryption fails (might be unencrypted legacy)
  }
};
