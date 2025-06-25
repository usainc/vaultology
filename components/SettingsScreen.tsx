import React, { useState, useEffect } from 'react';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { PasswordStrengthCriteria } from '../types';
import { validatePassword } from '../utils/validation';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';

interface SettingsScreenProps {
  onChangeMasterPassword: (currentMasterPasswordAttempt: string, newMasterPassword: string, currentSecurityAnswer: string) => Promise<boolean>;
  onChangeSecurityQuestionAndAnswer: (currentMasterPasswordAttempt: string, newSecurityQuestion: string, newSecurityAnswer: string) => Promise<boolean>;
  currentSecurityQuestion: string;
  isLoading: boolean; // For disabling forms during App-level operations
}

const initialPasswordCriteria: PasswordStrengthCriteria = {
  minLength: false, uppercase: false, lowercase: false, number: false, specialChar: false,
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onChangeMasterPassword,
  onChangeSecurityQuestionAndAnswer,
  currentSecurityQuestion,
  isLoading: isAppLoading,
}) => {
  // Change Master Password States
  const [currentPasswordForMP, setCurrentPasswordForMP] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmNewMasterPassword, setConfirmNewMasterPassword] = useState('');
  const [currentSecurityAnswerForMP, setCurrentSecurityAnswerForMP] = useState('');
  const [mpPasswordCriteria, setMpPasswordCriteria] = useState<PasswordStrengthCriteria>(initialPasswordCriteria);
  const [isNewMpStrongEnough, setIsNewMpStrongEnough] = useState(false);
  const [showCurrentPasswordForMP, setShowCurrentPasswordForMP] = useState(false);
  const [showNewMasterPassword, setShowNewMasterPassword] = useState(false);
  const [showConfirmNewMasterPassword, setShowConfirmNewMasterPassword] = useState(false);
  const [showCurrentSecurityAnswerForMP, setShowCurrentSecurityAnswerForMP] = useState(false);


  // Change Security Question/Answer States
  const [currentPasswordForSQ, setCurrentPasswordForSQ] = useState('');
  const [newSecQuestion, setNewSecQuestion] = useState('');
  const [newSecAnswer, setNewSecAnswer] = useState('');
  const [confirmNewSecAnswer, setConfirmNewSecAnswer] = useState('');
  const [showCurrentPasswordForSQ, setShowCurrentPasswordForSQ] = useState(false);
  const [showNewSecAnswer, setShowNewSecAnswer] = useState(false);
  const [showConfirmNewSecAnswer, setShowConfirmNewSecAnswer] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [isChangingMP, setIsChangingMP] = useState(false);
  const [isChangingSQ, setIsChangingSQ] = useState(false);

  useEffect(() => {
    const { criteria, meetsAllCriteria } = validatePassword(newMasterPassword);
    setMpPasswordCriteria(criteria);
    setIsNewMpStrongEnough(meetsAllCriteria);
  }, [newMasterPassword]);
  
  const displayLocalError = (form: 'mp' | 'sq', message: string) => {
    setLocalError(message); // One error for the whole screen, or can be form-specific
    setLocalSuccess(null);
  };

  const displayLocalSuccess = (message: string) => {
    setLocalSuccess(message);
    setLocalError(null);
    setTimeout(() => setLocalSuccess(null), 4000);
  };

  const clearLocalMessages = () => {
    setLocalError(null);
    setLocalSuccess(null);
  };

  const handleChangeMasterPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLocalMessages();

    if (!isNewMpStrongEnough) {
      displayLocalError('mp', "New master password does not meet strength requirements.");
      return;
    }
    if (newMasterPassword !== confirmNewMasterPassword) {
      displayLocalError('mp', "New master passwords do not match.");
      return;
    }
    if (!currentSecurityAnswerForMP.trim()) {
        displayLocalError('mp', "Current security answer is required to update master password recovery data.");
        return;
    }

    setIsChangingMP(true);
    const success = await onChangeMasterPassword(currentPasswordForMP, newMasterPassword, currentSecurityAnswerForMP);
    setIsChangingMP(false);
    if (success) {
      displayLocalSuccess("Master password change initiated. Check global messages for final status.");
      // Reset form fields
      setCurrentPasswordForMP('');
      setNewMasterPassword('');
      setConfirmNewMasterPassword('');
      setCurrentSecurityAnswerForMP('');
    } else {
      displayLocalError('mp', "Failed to change master password. Check global messages or input.");
    }
  };

  const handleChangeSecurityQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLocalMessages();

    if (!newSecQuestion.trim() || newSecQuestion.trim().length < 10) {
      displayLocalError('sq', "New security question must be at least 10 characters long.");
      return;
    }
    if (!newSecAnswer.trim() || newSecAnswer.trim().length < 6) {
      displayLocalError('sq', "New security answer must be at least 6 characters long.");
      return;
    }
    if (newSecAnswer !== confirmNewSecAnswer) {
      displayLocalError('sq', "New security answers do not match.");
      return;
    }
    
    setIsChangingSQ(true);
    const success = await onChangeSecurityQuestionAndAnswer(currentPasswordForSQ, newSecQuestion, newSecAnswer);
    setIsChangingSQ(false);
    if (success) {
      displayLocalSuccess("Security question/answer change initiated. Check global messages for final status.");
      // Reset form fields
      setCurrentPasswordForSQ('');
      setNewSecQuestion('');
      setNewSecAnswer('');
      setConfirmNewSecAnswer('');
    } else {
      displayLocalError('sq', "Failed to change security question/answer. Check global messages or input.");
    }
  };

  const renderPasswordCriteria = () => {
    const criteriaList = [
      { label: "At least 12 characters", met: mpPasswordCriteria.minLength },
      { label: "One uppercase letter (A-Z)", met: mpPasswordCriteria.uppercase },
      { label: "One lowercase letter (a-z)", met: mpPasswordCriteria.lowercase },
      { label: "One number (0-9)", met: mpPasswordCriteria.number },
      { label: "One special character (!@#$...)", met: mpPasswordCriteria.specialChar },
    ];
    return (
      <div className="mt-2 mb-3 p-3 bg-slate-700 rounded-md text-sm">
        <ul className="space-y-0.5">
          {criteriaList.map(item => (
            <li key={item.label} className={`flex items-center ${item.met ? 'text-green-400' : 'text-slate-400'}`}>
              <span className="mr-2">{item.met ? '✓' : '◦'}</span> {item.label}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const isOverallLoading = isAppLoading || isChangingMP || isChangingSQ;

  return (
    <div className="space-y-12">
      {localError && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-800 border border-red-600 rounded-md" role="alert">
          {localError}
        </div>
      )}
      {localSuccess && (
        <div className="mb-4 p-3 text-sm text-green-300 bg-green-800 border border-green-700 rounded-md" role="status">
          {localSuccess}
        </div>
      )}

      {/* Change Master Password Form */}
      <section aria-labelledby="change-mp-heading">
        <h3 id="change-mp-heading" className="text-xl font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-2">Change Master Password</h3>
        <form onSubmit={handleChangeMasterPasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPasswordForMP" className="block text-sm font-medium text-slate-300 mb-1">Current Master Password</label>
            <div className="relative">
              <Input id="currentPasswordForMP" type={showCurrentPasswordForMP ? 'text' : 'password'} value={currentPasswordForMP} onChange={(e) => setCurrentPasswordForMP(e.target.value)} required disabled={isOverallLoading} />
              <button type="button" onClick={() => setShowCurrentPasswordForMP(!showCurrentPasswordForMP)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-sky-400" title={showCurrentPasswordForMP ? "Hide" : "Show"}>
                {showCurrentPasswordForMP ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="newMasterPassword" className="block text-sm font-medium text-slate-300 mb-1">New Master Password</label>
            <div className="relative">
              <Input id="newMasterPassword" type={showNewMasterPassword ? 'text' : 'password'} value={newMasterPassword} onChange={(e) => setNewMasterPassword(e.target.value)} required disabled={isOverallLoading} />
              <button type="button" onClick={() => setShowNewMasterPassword(!showNewMasterPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-sky-400" title={showNewMasterPassword ? "Hide" : "Show"}>
                {showNewMasterPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
              </button>
            </div>
            {renderPasswordCriteria()}
          </div>
          <div>
            <label htmlFor="confirmNewMasterPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirm New Master Password</label>
             <div className="relative">
              <Input id="confirmNewMasterPassword" type={showConfirmNewMasterPassword ? 'text' : 'password'} value={confirmNewMasterPassword} onChange={(e) => setConfirmNewMasterPassword(e.target.value)} required disabled={isOverallLoading} />
              <button type="button" onClick={() => setShowConfirmNewMasterPassword(!showConfirmNewMasterPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-sky-400" title={showConfirmNewMasterPassword ? "Hide" : "Show"}>
                {showConfirmNewMasterPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
              </button>
            </div>
          </div>
           <div>
            <label htmlFor="currentSecurityAnswerForMP" className="block text-sm font-medium text-slate-300 mb-1">Current Security Answer</label>
            <div className="relative">
                <Input id="currentSecurityAnswerForMP" type={showCurrentSecurityAnswerForMP ? 'text' : 'password'} value={currentSecurityAnswerForMP} onChange={(e) => setCurrentSecurityAnswerForMP(e.target.value)} required disabled={isOverallLoading} placeholder="Needed to update recovery data" />
                 <button type="button" onClick={() => setShowCurrentSecurityAnswerForMP(!showCurrentSecurityAnswerForMP)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-sky-400" title={showCurrentSecurityAnswerForMP ? "Hide" : "Show"}>
                    {showCurrentSecurityAnswerForMP ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Your current security answer is required to ensure your master password can still be recovered after changing it.</p>
          </div>
          <Button type="submit" variant="primary" isLoading={isChangingMP} disabled={isOverallLoading || !isNewMpStrongEnough || newMasterPassword !== confirmNewMasterPassword || !currentSecurityAnswerForMP.trim()}>
            Change Master Password
          </Button>
        </form>
      </section>

      {/* Change Security Question & Answer Form */}
      <section aria-labelledby="change-sq-heading">
        <h3 id="change-sq-heading" className="text-xl font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-2">Change Security Question & Answer</h3>
        <form onSubmit={handleChangeSecurityQuestionSubmit} className="space-y-4">
          <div className="mb-3 p-3 bg-slate-700 rounded-md">
             <p className="text-sm text-slate-300">Current Security Question:</p>
             <p className="font-medium text-slate-100">{currentSecurityQuestion || "Not set"}</p>
          </div>
          <div>
            <label htmlFor="currentPasswordForSQ" className="block text-sm font-medium text-slate-300 mb-1">Current Master Password</label>
             <div className="relative">
                <Input id="currentPasswordForSQ" type={showCurrentPasswordForSQ ? 'text' : 'password'} value={currentPasswordForSQ} onChange={(e) => setCurrentPasswordForSQ(e.target.value)} required disabled={isOverallLoading} />
                <button type="button" onClick={() => setShowCurrentPasswordForSQ(!showCurrentPasswordForSQ)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-sky-400" title={showCurrentPasswordForSQ ? "Hide" : "Show"}>
                    {showCurrentPasswordForSQ ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                </button>
            </div>
          </div>
          <div>
            <label htmlFor="newSecQuestion" className="block text-sm font-medium text-slate-300 mb-1">New Security Question</label>
            <Input id="newSecQuestion" type="text" value={newSecQuestion} onChange={(e) => setNewSecQuestion(e.target.value)} required minLength={10} disabled={isOverallLoading} placeholder="e.g., What is your favorite book?"/>
          </div>
          <div>
            <label htmlFor="newSecAnswer" className="block text-sm font-medium text-slate-300 mb-1">New Security Answer</label>
             <div className="relative">
                <Input id="newSecAnswer" type={showNewSecAnswer ? 'text' : 'password'} value={newSecAnswer} onChange={(e) => setNewSecAnswer(e.target.value)} required minLength={6} disabled={isOverallLoading} />
                <button type="button" onClick={() => setShowNewSecAnswer(!showNewSecAnswer)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-sky-400" title={showNewSecAnswer ? "Hide" : "Show"}>
                    {showNewSecAnswer ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                </button>
            </div>
             <p className="mt-1 text-xs text-slate-500">Case-sensitive. Minimum 6 characters.</p>
          </div>
          <div>
            <label htmlFor="confirmNewSecAnswer" className="block text-sm font-medium text-slate-300 mb-1">Confirm New Security Answer</label>
             <div className="relative">
                <Input id="confirmNewSecAnswer" type={showConfirmNewSecAnswer ? 'text' : 'password'} value={confirmNewSecAnswer} onChange={(e) => setConfirmNewSecAnswer(e.target.value)} required disabled={isOverallLoading} />
                <button type="button" onClick={() => setShowConfirmNewSecAnswer(!showConfirmNewSecAnswer)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-sky-400" title={showConfirmNewSecAnswer ? "Hide" : "Show"}>
                    {showConfirmNewSecAnswer ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                </button>
            </div>
          </div>
          <Button type="submit" variant="primary" isLoading={isChangingSQ} disabled={isOverallLoading || newSecAnswer !== confirmNewSecAnswer || newSecQuestion.trim().length < 10 || newSecAnswer.trim().length < 6}>
            Change Security Question & Answer
          </Button>
        </form>
      </section>
    </div>
  );
};
