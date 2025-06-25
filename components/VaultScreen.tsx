import React, { useState } from 'react';
import { PasswordEntry } from '../types';
import { Button } from './common/Button';
import { PasswordList } from './PasswordList';
import { PasswordFormModal } from './PasswordFormModal';
import { SettingsScreen } from './SettingsScreen'; // Import SettingsScreen
import { PlusIcon } from './icons/PlusIcon';
import { LockIcon } from './icons/LockIcon';
import { CogIcon } from './icons/CogIcon'; // Import CogIcon

interface VaultScreenProps {
  username: string;
  passwords: PasswordEntry[];
  onAddPassword: (newEntryData: Omit<PasswordEntry, 'id'>) => Promise<void>;
  onUpdatePassword: (updatedEntry: PasswordEntry) => Promise<void>;
  onDeletePassword: (id: string, entryName: string) => Promise<void>;
  onLock: () => void;
  onChangeMasterPassword: (currentMasterPasswordAttempt: string, newMasterPassword: string, currentSecurityAnswer: string) => Promise<boolean>;
  onChangeSecurityQuestionAndAnswer: (currentMasterPasswordAttempt: string, newSecurityQuestion: string, newSecurityAnswer: string) => Promise<boolean>;
  currentSecurityQuestion: string;
  isLoadingApp: boolean;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({
  username,
  passwords,
  onAddPassword,
  onUpdatePassword,
  onDeletePassword,
  onLock,
  onChangeMasterPassword,
  onChangeSecurityQuestionAndAnswer,
  currentSecurityQuestion,
  isLoadingApp,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false); // State for settings view

  const handleOpenModalForAdd = () => {
    setEditingPassword(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (passwordEntry: PasswordEntry) => {
    setEditingPassword(passwordEntry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPassword(null);
  };

  const handleSubmitForm = async (entryData: Omit<PasswordEntry, 'id'> | PasswordEntry) => {
    if ('id' in entryData && entryData.id) {
      await onUpdatePassword(entryData as PasswordEntry);
    } else {
      await onAddPassword(entryData as Omit<PasswordEntry, 'id'>);
    }
    handleCloseModal();
  };
  
  const filteredPasswords = passwords.filter(entry => 
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.website && entry.website.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSettingsView = () => setShowSettings(!showSettings);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-slate-800 rounded-lg shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-100">
          {showSettings ? `${username}'s Settings` : `${username}'s Vault`}
        </h2>
        <div className="flex gap-2">
          {!showSettings && (
            <Button onClick={handleOpenModalForAdd} variant="primary" size="md">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Password
            </Button>
          )}
          <Button onClick={toggleSettingsView} variant="secondary" size="md" className="bg-slate-700 hover:bg-slate-600">
            <CogIcon className="w-5 h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{showSettings ? 'Back to Vault' : 'Settings'}</span>
            <span className="sm:hidden">{showSettings ? 'Vault' : 'Settings'}</span>
          </Button>
          <Button onClick={onLock} variant="secondary" size="md" className="bg-red-700 hover:bg-red-600 text-white">
            <LockIcon className="w-5 h-5 mr-1 sm:mr-2" />
             <span className="hidden sm:inline">Lock Vault</span>
             <span className="sm:hidden">Lock</span>
          </Button>
        </div>
      </div>

      {showSettings ? (
        <SettingsScreen
          onChangeMasterPassword={onChangeMasterPassword}
          onChangeSecurityQuestionAndAnswer={onChangeSecurityQuestionAndAnswer}
          currentSecurityQuestion={currentSecurityQuestion}
          isLoading={isLoadingApp} // Pass app-level loading state
        />
      ) : (
        <>
          <div className="mb-6">
            <input
              type="search"
              placeholder="Search vault (by name, username, website)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
              aria-label="Search password entries"
            />
          </div>

          {isModalOpen && (
            <PasswordFormModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSubmit={handleSubmitForm}
              initialData={editingPassword || undefined}
            />
          )}

          {filteredPasswords.length > 0 ? (
            <PasswordList
              passwords={filteredPasswords}
              onEdit={handleOpenModalForEdit}
              onDelete={(id, name) => {
                if (window.confirm(`Are you sure you want to delete the entry for "${name}"? This cannot be undone.`)) {
                  onDeletePassword(id, name);
                }
              }}
            />
          ) : (
            <div className="text-center py-10 px-6 bg-slate-700 rounded-md">
              <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-slate-300">
                {searchTerm ? 'No matching entries' : 'Vault is Empty'}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {searchTerm ? 'Try a different search term.' : "Get started by adding a new password entry."}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Button onClick={handleOpenModalForAdd} variant="primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add First Password
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};