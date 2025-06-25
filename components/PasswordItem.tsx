import React, { useState, useCallback } from 'react';
import { PasswordEntry } from '../types';
import { Button } from './common/Button';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { CopyIcon } from './icons/CopyIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';

interface PasswordItemProps {
  entry: PasswordEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export const PasswordItem: React.FC<PasswordItemProps> = ({ entry, onEdit, onDelete }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = useCallback(() => {
    if (!entry.password) return;
    navigator.clipboard.writeText(entry.password)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy password: ', err));
  }, [entry.password]);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="bg-slate-700 p-4 rounded-lg shadow transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <h3 className="text-xl font-semibold text-sky-400 break-all">{entry.name}</h3>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Button variant="icon" size="sm" onClick={onEdit} title="Edit Entry">
            <EditIcon className="w-5 h-5" />
          </Button>
          <Button variant="icon" size="sm" onClick={onDelete} title="Delete Entry" className="hover:text-red-400">
            <TrashIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-slate-400">Username:</span>
          <span className="ml-2 text-slate-200 break-all">{entry.username}</span>
        </div>
        
        {entry.password && (
          <div className="flex items-center">
            <span className="font-medium text-slate-400">Password:</span>
            <div className="ml-2 flex items-center space-x-2 bg-slate-600 px-2 py-1 rounded">
              <span className={`text-slate-200 ${!showPassword && 'tracking-wider'}`}>
                {showPassword ? entry.password : '••••••••••••'}
              </span>
              <Button variant="icon" size="sm" onClick={toggleShowPassword} title={showPassword ? 'Hide Password' : 'Show Password'}>
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </Button>
            </div>
            <Button variant="icon" size="sm" onClick={handleCopyPassword} title={copied ? 'Copied!' : 'Copy Password'}>
              <CopyIcon className="w-4 h-4 ml-1" />
              {copied && <span className="text-xs text-green-400 ml-1">Copied!</span>}
            </Button>
          </div>
        )}

        {entry.website && (
          <div>
            <span className="font-medium text-slate-400">Website:</span>
            <a 
              href={entry.website.startsWith('http') ? entry.website : `https://${entry.website}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-sky-400 hover:text-sky-300 hover:underline break-all"
            >
              {entry.website}
            </a>
          </div>
        )}

        {entry.notes && (
          <div className="pt-1">
            <span className="font-medium text-slate-400">Notes:</span>
            <p className="text-slate-300 whitespace-pre-wrap break-words bg-slate-600 p-2 rounded mt-1">{entry.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
