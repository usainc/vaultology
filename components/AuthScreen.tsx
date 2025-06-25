
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { KeyIcon } from './icons/KeyIcon';
import { LockIcon } from './icons/LockIcon';
import { validatePassword } from '../utils/validation';
import { PasswordStrengthCriteria } from '../types';

type AuthMode = 'unlock' | 'setup' | 'forgotPassword' | 'setNewPasswordAfterRecovery';

interface AuthScreenProps {
  isVaultSet: boolean;
  onSetup: (username: string, masterPassword: string, securityQuestion: string, securityAnswer: string) => Promise<void>;
  onUnlock: (masterPassword: string) => Promise<void>;
  onVerifySecurityAnswer: (securityAnswerAttempt: string) => Promise<boolean>; // Returns true if SA is correct
  onCompletePasswordReset: (newMasterPassword: string) => Promise<void>; // Handles setting new MP
  showNewPasswordForm: boolean; // True if postRecoveryContext is set in App.tsx
  onResetRequest: () => void;
  currentUsername?: string | null;
  securityQuestion?: string | null;
  setExternalError: (error: string | null) => void;
  isLoadingGlobal?: boolean;
}

const initialPasswordCriteria: PasswordStrengthCriteria = {
  minLength: false, uppercase: false, lowercase: false, number: false, specialChar: false,
};

export const AuthScreen: React.FC<AuthScreenProps> = ({
  isVaultSet,
  onSetup,
  onUnlock,
  onVerifySecurityAnswer,
  onCompletePasswordReset,
  showNewPasswordForm,
  onResetRequest,
  currentUsername,
  securityQuestion,
  setExternalError,
  isLoadingGlobal = false,
}) => {
  const [mode, setMode] = useState<AuthMode>(isVaultSet ? 'unlock' : 'setup');
  
  const [username, setUsername] = useState('');
  const [secQuestion, setSecQuestion] = useState('');
  const [secAnswer, setSecAnswer] = useState('');
  const [confirmSecAnswer, setConfirmSecAnswer] = useState('');

  const [masterPassword, setMasterPassword] = useState(''); // For setup and unlock
  const [confirmPassword, setConfirmPassword] = useState(''); // For setup
  
  const [recoveryAnswer, setRecoveryAnswer] = useState(''); // For forgotPassword mode
  const [newMasterPasswordAfterRecovery, setNewMasterPasswordAfterRecovery] = useState('');
  const [confirmNewMasterPasswordAfterRecovery, setConfirmNewMasterPasswordAfterRecovery] = useState('');


  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordStrengthCriteria>(initialPasswordCriteria);
  const [isPasswordStrongEnough, setIsPasswordStrongEnough] = useState(false);
  
  const [newPasswordCriteria, setNewPasswordCriteria] = useState<PasswordStrengthCriteria>(initialPasswordCriteria);
  const [isNewPasswordStrongEnough, setIsNewPasswordStrongEnough] = useState(false);


  useEffect(() => {
    if (showNewPasswordForm) {
      setMode('setNewPasswordAfterRecovery');
      setRecoveryAnswer(''); // Clear previous input
      setMasterPassword(''); // Clear unlock attempt
    } else if (isVaultSet && mode !== 'forgotPassword' && mode !== 'setNewPasswordAfterRecovery') {
        setMode('unlock');
    } else if (!isVaultSet) {
        setMode('setup');
    }
  }, [isVaultSet, showNewPasswordForm]);

  useEffect(() => {
    if (mode === 'setup') {
      const { criteria, meetsAllCriteria } = validatePassword(masterPassword);
      setPasswordCriteria(criteria);
      setIsPasswordStrongEnough(meetsAllCriteria);
    } else if (mode === 'setNewPasswordAfterRecovery') {
      const { criteria, meetsAllCriteria } = validatePassword(newMasterPasswordAfterRecovery);
      setNewPasswordCriteria(criteria);
      setIsNewPasswordStrongEnough(meetsAllCriteria);
    }
  }, [masterPassword, newMasterPasswordAfterRecovery, mode]);

  const displayError = (message: string) => {
    setLocalError(message);
    setExternalError(message); 
  };

  const clearErrorsAndState = () => {
    setLocalError(null);
    setExternalError(null);
    // Reset relevant form fields based on mode or universally
    setMasterPassword('');
    setConfirmPassword('');
    setRecoveryAnswer('');
    setNewMasterPasswordAfterRecovery('');
    setConfirmNewMasterPasswordAfterRecovery('');
    if (mode === 'setup') {
        setUsername('');
        setSecQuestion('');
        setSecAnswer('');
        setConfirmSecAnswer('');
    }
  };


  const handleSetupSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null); setExternalError(null); // Clear errors on new submit attempt
    if (!username.trim()) { displayError("Username is required."); return; }
    if (username.trim().length < 3) { displayError("Username must be at least 3 characters long."); return; }
    if (!isPasswordStrongEnough) { displayError("Master password does not meet all strength requirements."); return; }
    if (masterPassword !== confirmPassword) { displayError("Master passwords do not match."); return; }
    if (!secQuestion.trim()) { displayError("Security question is required."); return; }
    if (secQuestion.trim().length < 10) { displayError("Security question must be at least 10 characters long."); return;}
    if (!secAnswer.trim()) { displayError("Security answer is required."); return; }
    if (secAnswer !== confirmSecAnswer) { displayError("Security answers do not match."); return; }
    if (secAnswer.trim().length < 6) { displayError("Security answer must be at least 6 characters long."); return; }

    setLocalIsLoading(true);
    await onSetup(username, masterPassword, secQuestion, secAnswer);
    setLocalIsLoading(false);
  }, [username, masterPassword, confirmPassword, secQuestion, secAnswer, confirmSecAnswer, onSetup, isPasswordStrongEnough, setExternalError]);

  const handleUnlockSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null); setExternalError(null);
    if (!masterPassword) { displayError("Master password cannot be empty."); return; }
    setLocalIsLoading(true);
    await onUnlock(masterPassword);
    setLocalIsLoading(false);
  }, [masterPassword, onUnlock, setExternalError]);

  const handleVerifySecurityAnswerSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null); setExternalError(null);
    if (!recoveryAnswer.trim()) { displayError("Security answer cannot be empty."); return; }
    setLocalIsLoading(true);
    const success = await onVerifySecurityAnswer(recoveryAnswer);
    setLocalIsLoading(false);
    if (success) {
      setRecoveryAnswer(''); 
    }
  }, [recoveryAnswer, onVerifySecurityAnswer, setExternalError]);

  const handleCompletePasswordResetSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null); setExternalError(null);
    if (!isNewPasswordStrongEnough) { displayError("New master password does not meet strength requirements."); return; }
    if (newMasterPasswordAfterRecovery !== confirmNewMasterPasswordAfterRecovery) { displayError("New master passwords do not match."); return; }
    
    setLocalIsLoading(true);
    await onCompletePasswordReset(newMasterPasswordAfterRecovery);
    setLocalIsLoading(false);
    setNewMasterPasswordAfterRecovery('');
    setConfirmNewMasterPasswordAfterRecovery('');
  }, [newMasterPasswordAfterRecovery, confirmNewMasterPasswordAfterRecovery, onCompletePasswordReset, isNewPasswordStrongEnough, setExternalError]);


  const renderPasswordCriteriaDisplay = (criteria: PasswordStrengthCriteria) => {
    const criteriaList = [
      { label: "At least 12 characters", met: criteria.minLength },
      { label: "At least one uppercase letter (A-Z)", met: criteria.uppercase },
      { label: "At least one lowercase letter (a-z)", met: criteria.lowercase },
      { label: "At least one number (0-9)", met: criteria.number },
      { label: "At least one special character (!@#$...)", met: criteria.specialChar },
    ];
    return (
      <div className="mt-2 mb-4 p-3 bg-slate-700 rounded-md text-sm">
        <p className="font-medium text-slate-300 mb-1">Password requirements:</p>
        <ul className="list-inside space-y-0.5">
          {criteriaList.map(item => (
            <li key={item.label} className={`flex items-center ${item.met ? 'text-green-400' : 'text-slate-400'}`}>
              <span className="mr-2">{item.met ? '✓' : '◦'}</span>{item.label}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  const formIsBusy = isLoadingGlobal || localIsLoading;

  const commonSetupMasterPasswordFields = (
    <>
      <div>
        <label htmlFor="masterPasswordAuth" className="block text-sm font-medium text-slate-300 mb-1">Master Password</label>
        <Input id="masterPasswordAuth" type="password" value={masterPassword} onChange={(e) => { setMasterPassword(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Create a strong master password" required aria-describedby="masterPasswordHelp" disabled={formIsBusy} />
        <p id="masterPasswordHelp" className="mt-1 text-xs text-slate-500">This password encrypts your vault. Choose a strong, unique password.</p>
      </div>
      {renderPasswordCriteriaDisplay(passwordCriteria)}
      <div>
        <label htmlFor="confirmPasswordAuth" className="block text-sm font-medium text-slate-300 mb-1">Confirm Master Password</label>
        <Input id="confirmPasswordAuth" type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Confirm your master password" required disabled={formIsBusy} />
      </div>
    </>
  );

  let formContent, title, subTitle, submitHandler, buttonText;

  if (mode === 'setup') {
    title = 'Create Your Vaultology Account';
    subTitle = 'Set up your secure, local Vaultology account.';
    submitHandler = handleSetupSubmit;
    buttonText = 'Create Account & Vault';
    formContent = (
      <>
        <div>
          <label htmlFor="usernameAuth" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
          <Input id="usernameAuth" type="text" value={username} onChange={(e) => { setUsername(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Choose a username" required minLength={3} disabled={formIsBusy} />
        </div>
        {commonSetupMasterPasswordFields}
        <hr className="my-6 border-slate-600" />
        <h3 className="text-lg font-medium text-slate-200 mb-1">Security Question & Answer</h3>
        <p className="text-xs text-slate-400 mb-3">Used to recover your master password. Choose wisely.</p>
        <div>
          <label htmlFor="securityQuestionAuth" className="block text-sm font-medium text-slate-300 mb-1">Security Question</label>
          <Input id="securityQuestionAuth" type="text" value={secQuestion} onChange={(e) => { setSecQuestion(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="e.g., What was your childhood nickname?" required minLength={10} disabled={formIsBusy} />
        </div>
        <div>
          <label htmlFor="securityAnswerAuth" className="block text-sm font-medium text-slate-300 mb-1">Security Answer</label>
          <Input id="securityAnswerAuth" type="password" value={secAnswer} onChange={(e) => { setSecAnswer(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Your secret answer (case-sensitive)" required minLength={6} disabled={formIsBusy} />
           <p className="mt-1 text-xs text-slate-500">Case-sensitive. Minimum 6 characters.</p>
        </div>
        <div>
          <label htmlFor="confirmSecurityAnswerAuth" className="block text-sm font-medium text-slate-300 mb-1">Confirm Security Answer</label>
          <Input id="confirmSecurityAnswerAuth" type="password" value={confirmSecAnswer} onChange={(e) => { setConfirmSecAnswer(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Confirm your secret answer" required disabled={formIsBusy} />
        </div>
      </>
    );
  } else if (mode === 'unlock') {
    title = `Unlock Vaultology${currentUsername ? ` for ${currentUsername}` : ''}`;
    subTitle = 'Enter your master password to access your vault.';
    submitHandler = handleUnlockSubmit;
    buttonText = 'Unlock';
    formContent = (
        <div>
            <label htmlFor="masterPasswordUnlock" className="block text-sm font-medium text-slate-300 mb-1">Master Password</label>
            <Input id="masterPasswordUnlock" type="password" value={masterPassword} onChange={(e) => { setMasterPassword(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Enter your master password" required disabled={formIsBusy} />
        </div>
    );
  } else if (mode === 'forgotPassword') {
    title = 'Recover Master Password';
    subTitle = 'Answer your security question.';
    submitHandler = handleVerifySecurityAnswerSubmit;
    buttonText = 'Verify Answer';
    formContent = (
      <>
        {securityQuestion ? (
          <div className="mb-4">
            <p className="text-sm text-slate-300">Your security question:</p>
            <p className="font-semibold text-slate-100 p-2 bg-slate-700 rounded mt-1">{securityQuestion}</p>
          </div>
        ) : (
          <p className="text-red-400 mb-4">Security question not found. Recovery may not be possible.</p>
        )}
        <div>
          <label htmlFor="recoveryAnswerAuth" className="block text-sm font-medium text-slate-300 mb-1">Your Security Answer</label>
          <Input id="recoveryAnswerAuth" type="password" value={recoveryAnswer} onChange={(e) => { setRecoveryAnswer(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Enter your secret answer (case-sensitive)" required disabled={!securityQuestion || formIsBusy} />
        </div>
      </>
    );
  } else { // mode === 'setNewPasswordAfterRecovery'
    title = 'Set New Master Password';
    subTitle = 'Your security answer was correct. Now, create a new master password.';
    submitHandler = handleCompletePasswordResetSubmit;
    buttonText = 'Set New Password & Unlock';
    formContent = (
        <>
            <div>
                <label htmlFor="newMasterPasswordRecovery" className="block text-sm font-medium text-slate-300 mb-1">New Master Password</label>
                <Input id="newMasterPasswordRecovery" type="password" value={newMasterPasswordAfterRecovery} onChange={(e) => { setNewMasterPasswordAfterRecovery(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Create a new strong master password" required disabled={formIsBusy} />
            </div>
            {renderPasswordCriteriaDisplay(newPasswordCriteria)}
            <div>
                <label htmlFor="confirmNewMasterPasswordRecovery" className="block text-sm font-medium text-slate-300 mb-1">Confirm New Master Password</label>
                <Input id="confirmNewMasterPasswordRecovery" type="password" value={confirmNewMasterPasswordAfterRecovery} onChange={(e) => { setConfirmNewMasterPasswordAfterRecovery(e.target.value); setLocalError(null); setExternalError(null); }} placeholder="Confirm your new master password" required disabled={formIsBusy} />
            </div>
        </>
    );
  }


  const canSubmitSetup = mode === 'setup' && isPasswordStrongEnough && masterPassword === confirmPassword && secAnswer === confirmSecAnswer && username.trim().length >= 3 && secQuestion.trim().length >= 10 && secAnswer.trim().length >= 6;
  const canSubmitUnlock = mode === 'unlock' && masterPassword.length > 0;
  const canSubmitVerifyAnswer = mode === 'forgotPassword' && recoveryAnswer.length > 0 && !!securityQuestion;
  const canSubmitCompleteReset = mode === 'setNewPasswordAfterRecovery' && isNewPasswordStrongEnough && newMasterPasswordAfterRecovery === confirmNewMasterPasswordAfterRecovery;


  let isSubmitDisabled = formIsBusy;
  if (!isSubmitDisabled) {
    if (mode === 'setup') isSubmitDisabled = !canSubmitSetup;
    else if (mode === 'unlock') isSubmitDisabled = !canSubmitUnlock;
    else if (mode === 'forgotPassword') isSubmitDisabled = !canSubmitVerifyAnswer;
    else if (mode === 'setNewPasswordAfterRecovery') isSubmitDisabled = !canSubmitCompleteReset;
  }


  return (
    <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-xl">
      <div className="flex flex-col items-center mb-6">
        {mode === 'setup' ? <KeyIcon className="w-16 h-16 text-sky-500 mb-3" /> : <LockIcon className="w-16 h-16 text-sky-500 mb-3" />}
        <h2 className="text-2xl font-semibold text-slate-100">{title}</h2>
        <p className="text-slate-400 text-sm mt-1">{subTitle}</p>
      </div>

      {localError && (
         <div className="mb-4 p-3 text-sm text-red-300 bg-red-800 border border-red-600 rounded-md" role="alert">
          {localError}
        </div>
      )}

      <form onSubmit={submitHandler} className="space-y-4">
        {formContent}
        <Button type="submit" fullWidth isLoading={formIsBusy} className="bg-sky-600 hover:bg-sky-700 focus-visible:outline-sky-500 mt-6" disabled={isSubmitDisabled}>
          {formIsBusy ? 'Processing...' : buttonText}
        </Button>
      </form>
      
      {isVaultSet && mode === 'unlock' && (
        <div className="mt-6 text-center">
          <button onClick={() => { clearErrorsAndState(); setMode('forgotPassword'); }} className="text-sm text-sky-400 hover:text-sky-300 hover:underline" type="button" disabled={formIsBusy}>
            Forgot Master Password?
          </button>
        </div>
      )}
      {(mode === 'forgotPassword' || mode === 'setNewPasswordAfterRecovery') && (
        <div className="mt-6 text-center">
          <button onClick={() => { clearErrorsAndState(); setExternalError(null); setMode('unlock'); }} className="text-sm text-slate-400 hover:text-slate-300 hover:underline" type="button" disabled={formIsBusy}>
            Back to Unlock
          </button>
        </div>
      )}
      {isVaultSet && (mode === 'unlock' || mode === 'forgotPassword' || mode === 'setNewPasswordAfterRecovery') && (
         <div className="mt-4 pt-4 border-t border-slate-700 text-center">
            <button onClick={onResetRequest} className="text-sm text-red-400 hover:text-red-300 hover:underline" type="button" disabled={formIsBusy}>
                Reset Vaultology Completely
            </button>
            <p className="text-xs text-slate-500 mt-1">(Warning: This will delete all stored data)</p>
        </div>
      )}
    </div>
  );
};
