
import React, { useState, useEffect, useCallback } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { VaultScreen } from './components/VaultScreen';
import { UserInfo, PasswordEntry } from './types';
import {
  VAULT_USERNAME_KEY,
  VAULT_MP_SALT_KEY,
  VAULT_SA_SALT_KEY,
  VAULT_SECURITY_QUESTION_KEY,
  VAULT_ENCRYPTED_MP_FOR_RECOVERY_KEY,
  VAULT_TEST_PAYLOAD_KEY,
  VAULT_ENTRIES_KEY,
} from './constants';
import { decryptData, encryptData, deriveKey } from './services/cryptoService';
import {
  saveUsername, loadUsername,
  saveMpSalt, loadMpSalt,
  saveSaSalt, loadSaSalt,
  saveSecurityQuestion, loadSecurityQuestion,
  saveEncryptedMpForRecovery, loadEncryptedMpForRecovery,
  saveTestPayload, loadTestPayload,
  savePasswordEntries, loadPasswordEntries,
  clearVault as clearVaultData
} from './services/vaultService';
import { KeyIcon } from './components/icons/KeyIcon';
import { HeartIcon } from './components/icons/HeartIcon';

const TEST_PAYLOAD_SECRET = "VAULTOLOGY_OK_CHECK";

interface PostRecoveryContext {
  recoveredOldMP: string;
  securityAnswer: string;
  username: string;
}

const App: React.FC = () => {
  const [isVaultSet, setIsVaultSet] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [derivedMpKey, setDerivedMpKey] = useState<CryptoKey | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true for initial load check
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [securityQuestionForRecovery, setSecurityQuestionForRecovery] = useState<string | null>(null);
  const [postRecoveryContext, setPostRecoveryContext] = useState<PostRecoveryContext | null>(null);


  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const displaySuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  };
  
  const displayError = (message: string) => {
    setError(message);
  }

  const loadAndSetVaultEntries = async (key: CryptoKey) => {
    const encryptedEntries = loadPasswordEntries();
    if (encryptedEntries) {
      const decryptedEntriesJson = await decryptData(encryptedEntries, key);
      if (decryptedEntriesJson) {
        try {
          const parsedEntries = JSON.parse(decryptedEntriesJson) as PasswordEntry[];
          setPasswords(parsedEntries);
        } catch (e) {
          console.error("Failed to parse vault entries:", e);
          displayError("Failed to load vault entries. Data might be corrupt.");
          setPasswords([]);
        }
      } else {
        console.warn("Could not decrypt vault entries. This might be a new vault or data corruption after successful MP check.");
        setPasswords([]); 
        displayError("Vault entries are corrupted or unreadable. Please reset Vaultology if issues persist.");
      }
    } else {
      setPasswords([]);
      const emptyEncryptedEntries = await encryptData(JSON.stringify([]), key);
      savePasswordEntries(emptyEncryptedEntries);
    }
  };

  useEffect(() => {
    const checkVaultStatus = async () => {
      try {
        const existingUsername = loadUsername();
        const existingMpSalt = loadMpSalt();
        const existingTestPayload = loadTestPayload();
        const existingSecurityQuestion = loadSecurityQuestion();
        
        const vaultIsLikelySet = !!existingUsername && !!existingMpSalt && !!existingTestPayload && !!existingSecurityQuestion;
        setIsVaultSet(vaultIsLikelySet);
        if (vaultIsLikelySet && existingUsername) { 
          setCurrentUser({ username: existingUsername });
          setSecurityQuestionForRecovery(existingSecurityQuestion);
        }
      } catch (e) {
        console.error("Error during initial vault status check:", e);
        displayError("Failed to initialize Vaultology. Please try refreshing the page.");
      } finally {
        setIsLoading(false); 
      }
    };
    checkVaultStatus();
  }, []); 

  const handleVaultSetup = useCallback(async (
    usernameIn: string,
    masterPasswordIn: string,
    securityQuestionIn: string,
    securityAnswerIn: string
  ) => {
    try {
      clearMessages();
      setIsLoading(true);

      const mpSalt = crypto.getRandomValues(new Uint8Array(16));
      const saSalt = crypto.getRandomValues(new Uint8Array(16));

      const mpKey = await deriveKey(masterPasswordIn, mpSalt);
      const saKey = await deriveKey(securityAnswerIn, saSalt);

      const encryptedMasterPasswordForRecovery = await encryptData(masterPasswordIn, saKey);
      const encryptedTestPayload = await encryptData(TEST_PAYLOAD_SECRET, mpKey);
      const initialEncryptedEntries = await encryptData(JSON.stringify([]), mpKey); 

      saveUsername(usernameIn);
      saveMpSalt(mpSalt);
      saveSaSalt(saSalt);
      saveSecurityQuestion(securityQuestionIn);
      saveEncryptedMpForRecovery(encryptedMasterPasswordForRecovery);
      saveTestPayload(encryptedTestPayload);
      savePasswordEntries(initialEncryptedEntries); 

      setCurrentUser({ username: usernameIn });
      setDerivedMpKey(mpKey);
      setPasswords([]); 
      setSecurityQuestionForRecovery(securityQuestionIn);
      setIsVaultSet(true);
      setIsUnlocked(true);
      displaySuccess("Vault successfully created and unlocked!");
    } catch (err) {
      console.error("Vault setup failed:", err);
      displayError("Failed to set up vault. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUnlock = useCallback(async (masterPasswordIn: string) => {
    try {
      clearMessages();
      setIsLoading(true);
      const mpSalt = loadMpSalt();
      const encryptedTestPayload = loadTestPayload();
      const username = loadUsername();

      if (!mpSalt || !encryptedTestPayload || !username) {
        displayError("Vault data incomplete. Please set up the vault or reset.");
        setIsVaultSet(false); 
      } else {
        const mpKeyAttempt = await deriveKey(masterPasswordIn, mpSalt);
        const decryptedPayload = await decryptData(encryptedTestPayload, mpKeyAttempt);

        if (decryptedPayload === TEST_PAYLOAD_SECRET) {
          setDerivedMpKey(mpKeyAttempt);
          setCurrentUser({ username });
          await loadAndSetVaultEntries(mpKeyAttempt);
          setIsUnlocked(true);
          displaySuccess("Vault unlocked successfully!");
        } else {
          displayError("Failed to unlock vault. Master password may be incorrect.");
        }
      }
    } catch (err) {
      console.error("Unlock failed unexpectedly:", err);
      displayError("An unexpected error occurred during unlock.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleVerifySecurityAnswer = useCallback(async (securityAnswerAttempt: string): Promise<boolean> => {
    let success = false;
    try {
      clearMessages();
      setIsLoading(true);
      const saSalt = loadSaSalt();
      const encryptedMpForRecovery = loadEncryptedMpForRecovery();
      const username = loadUsername();
      
      if (!saSalt || !encryptedMpForRecovery || !username) {
        displayError("Recovery data is missing. Vault may be corrupted or not fully set up.");
      } else {
        const saKeyAttempt = await deriveKey(securityAnswerAttempt, saSalt);
        const recoveredMasterPassword = await decryptData(encryptedMpForRecovery, saKeyAttempt);

        if (recoveredMasterPassword) {
          const mpSalt = loadMpSalt();
          const encryptedTestPayload = loadTestPayload();
          if (!mpSalt || !encryptedTestPayload) {
              displayError("Cannot verify recovered master password integrity. Core data missing.");
          } else {
            const mpKeyFromRecoveredMP = await deriveKey(recoveredMasterPassword, mpSalt);
            const decryptedTestPayloadWithRecoveredMP = await decryptData(encryptedTestPayload, mpKeyFromRecoveredMP);

            if (decryptedTestPayloadWithRecoveredMP === TEST_PAYLOAD_SECRET) {
                setPostRecoveryContext({
                    recoveredOldMP: recoveredMasterPassword,
                    securityAnswer: securityAnswerAttempt,
                    username: username,
                });
                displaySuccess("Security answer verified. Please set your new master password.");
                success = true;
            } else {
                displayError("Security answer was correct, but the recovered master password seems inconsistent with vault data. Data might be corrupt.");
            }
          }
        } else {
          displayError("Security answer is incorrect.");
        }
      }
    } catch (err) {
      console.error("Security answer verification failed:", err);
      displayError("An error occurred during security answer verification.");
    } finally {
      setIsLoading(false);
    }
    return success;
  }, []);

  const handleChangeMasterPassword = useCallback(async (
    currentMasterPasswordAttempt: string,
    newMasterPassword: string,
    currentSecurityAnswer: string 
  ): Promise<boolean> => {
    let success = false;
    clearMessages();
    setIsLoading(true);
    try {
      const mpSalt = loadMpSalt();
      const saSalt = loadSaSalt(); 
      const encryptedTestPayload = loadTestPayload(); 

      if (!mpSalt || !saSalt || !encryptedTestPayload) {
        displayError("Core vault data missing. Cannot change master password.");
        setIsLoading(false);
        return false;
      }
      
      const currentMpKeyAttempt = await deriveKey(currentMasterPasswordAttempt, mpSalt); 
      const decryptedPayload = await decryptData(encryptedTestPayload, currentMpKeyAttempt);

      if (decryptedPayload !== TEST_PAYLOAD_SECRET) {
        displayError("Current master password incorrect.");
      } else {
        const currentEncryptedMpForRecovery = loadEncryptedMpForRecovery();
        if (!currentEncryptedMpForRecovery) {
          displayError("Encrypted master password for recovery data not found. Cannot proceed safely.");
        } else {
          const currentSaKey = await deriveKey(currentSecurityAnswer, saSalt);
          const masterPasswordFromRecoveryCheck = await decryptData(currentEncryptedMpForRecovery, currentSaKey);

          if (!masterPasswordFromRecoveryCheck || masterPasswordFromRecoveryCheck !== currentMasterPasswordAttempt) {
            displayError("Current security answer is incorrect or does not correspond to the current master password. Cannot update recovery data correctly.");
          } else {
            const newMpKey = await deriveKey(newMasterPassword, mpSalt); 
            
            const existingEncryptedEntries = loadPasswordEntries();
            let entriesJsonToReEncrypt = JSON.stringify([]); 

            if (existingEncryptedEntries) {
              const decryptedEntries = await decryptData(existingEncryptedEntries, currentMpKeyAttempt); 
              if (decryptedEntries) {
                entriesJsonToReEncrypt = decryptedEntries; 
              } else {
                displayError("CRITICAL: Failed to decrypt existing vault entries with the verified old master password. Master password change aborted to prevent data loss. Vault entries might be corrupt.");
                setIsLoading(false);
                return false; 
              }
            }
            
            const newEncryptedEntries = await encryptData(entriesJsonToReEncrypt, newMpKey);
            savePasswordEntries(newEncryptedEntries);

            const newEncryptedTestPayload = await encryptData(TEST_PAYLOAD_SECRET, newMpKey);
            saveTestPayload(newEncryptedTestPayload);

            const newEncryptedMpForRecovery = await encryptData(newMasterPassword, currentSaKey);
            saveEncryptedMpForRecovery(newEncryptedMpForRecovery);

            setDerivedMpKey(newMpKey); 
            
            displaySuccess("Master password changed successfully!");
            success = true;
          }
        }
      }
    } catch (err) {
      console.error("Change master password failed:", err);
      displayError("An unexpected error occurred while changing master password.");
    } finally {
      setIsLoading(false);
    }
    return success;
  }, []); 

  const handleCompletePasswordReset = useCallback(async (newMasterPassword: string): Promise<void> => {
    if (!postRecoveryContext) {
      displayError("Password recovery context is missing. Please start over.");
      setIsLoading(false); 
      return;
    }
    clearMessages();
    setIsLoading(true);

    const { recoveredOldMP, securityAnswer, username } = postRecoveryContext;

    const changeSuccess = await handleChangeMasterPassword(
      recoveredOldMP,
      newMasterPassword,
      securityAnswer
    );

    if (changeSuccess) {
      const newMpSalt = loadMpSalt(); 
      if (newMpSalt && username) { 
        const newMpKey = await deriveKey(newMasterPassword, newMpSalt);
        setDerivedMpKey(newMpKey); 
        setCurrentUser({ username });
        await loadAndSetVaultEntries(newMpKey); 
      } else {
         displayError("Failed to finalize session after password reset due to missing data (salt/username).");
      }
      setPostRecoveryContext(null);
      setIsUnlocked(true);
    } else {
      displayError("Failed to finalize master password reset. Please try the recovery process again.");
    }
    setIsLoading(false);
  }, [postRecoveryContext, handleChangeMasterPassword, loadAndSetVaultEntries]);


  const handleLock = () => {
    setIsUnlocked(false);
    setDerivedMpKey(null);
    setPasswords([]);
    setPostRecoveryContext(null);
    clearMessages();
  };
  
  const handleFullReset = () => {
    console.log("[App.tsx] handleFullReset triggered.");
    if (window.confirm("Are you sure you want to completely reset Vaultology? All data will be lost and you will need to set it up again. This action cannot be undone.")) {
      clearVaultData();
      setIsVaultSet(false);
      setIsUnlocked(false);
      setDerivedMpKey(null);
      setCurrentUser(null);
      setPasswords([]);
      setPostRecoveryContext(null);
      clearMessages();
      setSecurityQuestionForRecovery(null);
      window.location.reload(); 
    }
  };

  const handlePersistPasswords = async (updatedPasswords: PasswordEntry[]) => {
    if (!derivedMpKey) {
      displayError("Vault key is not available. Cannot save changes. Vault may have been locked.");
      setIsUnlocked(false); 
      return false;
    }
    let success = false;
    try {
      const encryptedEntries = await encryptData(JSON.stringify(updatedPasswords), derivedMpKey);
      savePasswordEntries(encryptedEntries);
      setPasswords(updatedPasswords); 
      success = true;
    } catch (e) {
      console.error("Failed to save password entries:", e);
      displayError("Failed to save changes to vault entries.");
    }
    return success;
  };

  const handleAddPassword = async (newEntryData: Omit<PasswordEntry, 'id'>) => {
    const newEntry: PasswordEntry = {
      ...newEntryData,
      id: crypto.randomUUID(),
    };
    const updatedPasswords = [...passwords, newEntry];
    if (await handlePersistPasswords(updatedPasswords)) {
      displaySuccess(`Entry "${newEntry.name}" added successfully.`);
    }
  };

  const handleUpdatePassword = async (updatedEntry: PasswordEntry) => {
    const updatedPasswords = passwords.map(p => p.id === updatedEntry.id ? updatedEntry : p);
    if (await handlePersistPasswords(updatedPasswords)) {
      displaySuccess(`Entry "${updatedEntry.name}" updated successfully.`);
    }
  };

  const handleDeletePassword = async (id: string, entryName: string) => {
    const updatedPasswords = passwords.filter(p => p.id !== id);
    if (await handlePersistPasswords(updatedPasswords)) {
       displaySuccess(`Entry "${entryName}" deleted successfully.`);
    }
  };

  const handleChangeSecurityQuestionAndAnswer = useCallback(async (
    currentMasterPasswordAttempt: string, 
    newSecurityQuestion: string,
    newSecurityAnswer: string
  ): Promise<boolean> => {
    let success = false;
    clearMessages();
    setIsLoading(true);
    try {
      const mpSalt = loadMpSalt();
      const encryptedTestPayload = loadTestPayload();

      if (!mpSalt || !encryptedTestPayload) {
        displayError("Core vault data missing. Cannot change security question/answer.");
      } else {
        const keyToVerifyCurrentMP = await deriveKey(currentMasterPasswordAttempt, mpSalt);
        const decryptedPayload = await decryptData(encryptedTestPayload, keyToVerifyCurrentMP);

        if (decryptedPayload !== TEST_PAYLOAD_SECRET) {
          displayError("Current master password incorrect. Cannot authorize security question change.");
        } else {
          const masterPasswordToReEncrypt = currentMasterPasswordAttempt;

          const newSaSalt = crypto.getRandomValues(new Uint8Array(16));
          const newSaKey = await deriveKey(newSecurityAnswer, newSaSalt);

          const newEncryptedMpForRecovery = await encryptData(masterPasswordToReEncrypt, newSaKey);

          saveSecurityQuestion(newSecurityQuestion);
          saveSaSalt(newSaSalt); 
          saveEncryptedMpForRecovery(newEncryptedMpForRecovery);

          setSecurityQuestionForRecovery(newSecurityQuestion); 
          displaySuccess("Security question and answer changed successfully!");
          success = true;
        }
      }
    } catch (err) {
      console.error("Change security Q&A failed:", err);
      displayError("An unexpected error occurred while changing security question/answer.");
    } finally {
      setIsLoading(false);
    }
    return success;
  }, []);


  if (isLoading && !isVaultSet && !isUnlocked && !postRecoveryContext && !error && !successMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-4">
        <KeyIcon className="w-16 h-16 text-sky-500 animate-pulse mb-4" />
        <p className="text-xl">Loading Vaultology...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4">
      <header className="w-full max-w-4xl py-6 mb-8 text-center">
        <h1 className="text-4xl font-bold text-sky-400 flex items-center justify-center space-x-3">
          <KeyIcon className="w-10 h-10" />
          <span>Vaultology</span>
        </h1>
        <p className="text-slate-400 mt-2">Your personal password vault and keeper.</p>
         {isUnlocked && currentUser && (
           <p className="text-slate-500 mt-1 text-sm">Welcome, {currentUser.username}!</p>
         )}
      </header>

      {error && (
        <div className="w-full max-w-md p-4 mb-4 text-sm text-red-300 bg-red-800 border border-red-700 rounded-md fixed top-5 left-1/2 -translate-x-1/2 z-[100]" role="alert">
          <div className="flex justify-between items-center">
            <span><span className="font-medium">Error:</span> {error}</span>
            <button onClick={clearMessages} className="ml-2 text-red-200 hover:text-red-100 text-lg leading-none">&times;</button>
          </div>
        </div>
      )}
      {successMessage && (
         <div className="w-full max-w-md p-4 mb-4 text-sm text-green-300 bg-green-800 border border-green-700 rounded-md fixed top-5 left-1/2 -translate-x-1/2 z-[100]" role="status">
           <div className="flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={clearMessages} className="ml-2 text-green-200 hover:text-green-100 text-lg leading-none">&times;</button>
          </div>
        </div>
      )}


      {!isUnlocked ? (
        <AuthScreen
          isVaultSet={isVaultSet}
          onSetup={handleVaultSetup}
          onUnlock={handleUnlock}
          onVerifySecurityAnswer={handleVerifySecurityAnswer}
          onCompletePasswordReset={handleCompletePasswordReset}
          showNewPasswordForm={!!postRecoveryContext}
          onResetRequest={handleFullReset}
          currentUsername={currentUser?.username}
          securityQuestion={securityQuestionForRecovery}
          setExternalError={displayError} 
          isLoadingGlobal={isLoading}
        />
      ) : (
        <VaultScreen
          username={currentUser!.username} 
          passwords={passwords}
          onAddPassword={handleAddPassword}
          onUpdatePassword={handleUpdatePassword}
          onDeletePassword={handleDeletePassword}
          onLock={handleLock}
          onChangeMasterPassword={handleChangeMasterPassword}
          onChangeSecurityQuestionAndAnswer={handleChangeSecurityQuestionAndAnswer}
          currentSecurityQuestion={securityQuestionForRecovery || ""}
          isLoadingApp={isLoading}
        />
      )}
      <footer className="w-full max-w-3xl py-6 mt-auto text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Vaultology. All data is stored and encrypted locally in your browser.</p>
        <p className="mb-2">Remember your master password and security answer. There is no other recovery mechanism for the master password itself.</p>
        <a 
            href="https://github.com/usainc" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors group"
        >
            <HeartIcon className="w-4 h-4 mr-2 text-pink-500 group-hover:text-pink-400 transition-colors" />
            Support Me on GitHub
        </a>
      </footer>
    </div>
  );
};

export default App;
