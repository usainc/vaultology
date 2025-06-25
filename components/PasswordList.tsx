import React from 'react';
import { PasswordEntry } from '../types';
import { PasswordItem } from './PasswordItem';

interface PasswordListProps {
  passwords: PasswordEntry[];
  onEdit: (passwordEntry: PasswordEntry) => void;
  onDelete: (id: string, name: string) => void; // Added name parameter
}

export const PasswordList: React.FC<PasswordListProps> = ({ passwords, onEdit, onDelete }) => {
  if (passwords.length === 0) {
    // This case should ideally be handled by VaultScreen's empty state message
    return null; 
  }

  return (
    <div className="space-y-4">
      {passwords.map((entry) => (
        <PasswordItem
          key={entry.id}
          entry={entry}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry.id, entry.name)} // Pass entry.name
        />
      ))}
    </div>
  );
};