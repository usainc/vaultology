import React, { useState, useEffect, FormEvent } from 'react';
import { PasswordEntry } from '../types';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';

interface PasswordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PasswordEntry, 'id'> | PasswordEntry) => void;
  initialData?: PasswordEntry;
}

export const PasswordFormModal: React.FC<PasswordFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setWebsite(initialData.website || '');
      setNotes(initialData.notes || '');
    } else {
      // Reset form for new entry
      setName('');
      setUsername('');
      setPassword('');
      setWebsite('');
      setNotes('');
    }
    setError(null); // Clear errors when data changes or modal opens/closes
  }, [initialData, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Entry name is required.");
      return;
    }
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    const entryData = {
      name: name.trim(),
      username: username.trim(),
      password: password.trim(), // Keep password as is, no further client-side encryption here
      website: website.trim(),
      notes: notes.trim(),
    };

    if (initialData && initialData.id) {
      onSubmit({ ...entryData, id: initialData.id });
    } else {
      onSubmit(entryData);
    }
  };
  
  const generatePassword = () => {
    // Basic password generator (example, can be made more robust)
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let newPassword = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        newPassword += charset.charAt(Math.floor(Math.random() * n));
    }
    setPassword(newPassword);
  };


  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-form-title"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <h2 id="password-form-title" className="text-2xl font-semibold text-slate-100 mb-6">
          {initialData ? 'Edit Password Entry' : 'Add New Password Entry'}
        </h2>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-300 bg-red-800 border border-red-600 rounded-md" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="entryName" className="block text-sm font-medium text-slate-300 mb-1">
              Name / Service
            </label>
            <Input
              id="entryName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Google, Amazon, My WiFi"
              required
            />
          </div>
          <div>
            <label htmlFor="entryUsername" className="block text-sm font-medium text-slate-300 mb-1">
              Username / Email
            </label>
            <Input
              id="entryUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username or email for this entry"
              required
            />
          </div>
          <div>
            <label htmlFor="entryPassword" className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="flex items-center space-x-2">
              <Input
                id="entryPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate password"
                required
                className="flex-grow"
              />
              <Button type="button" variant="icon" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Hide' : 'Show'}>
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </Button>
            </div>
             <Button 
                type="button" 
                onClick={generatePassword} 
                variant="secondary" 
                size="sm"
                className="mt-2 text-xs"
              >
                Generate Strong Password
              </Button>
          </div>
          <div>
            <label htmlFor="entryWebsite" className="block text-sm font-medium text-slate-300 mb-1">
              Website (Optional)
            </label>
            <Input
              id="entryWebsite"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g., https://www.example.com"
            />
          </div>
          <div>
            <label htmlFor="entryNotes" className="block text-sm font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="entryNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information, recovery codes, etc."
              rows={3}
              className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="bg-slate-600 hover:bg-slate-500">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-sky-600 hover:bg-sky-700">
              {initialData ? 'Save Changes' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
