
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const LanguageSelector = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('EN');

  const languages = [
    { code: 'EN', name: 'English (English)' },
    { code: 'HI', name: 'Hindi (हिंदी)' },
    { code: 'BN', name: 'Bengali (বাংলা)' },
    { code: 'TE', name: 'Telugu (తెలుగు)' },
    { code: 'MR', name: 'Marathi (मराठी)' },
    { code: 'TA', name: 'Tamil (தமிழ்)' },
    { code: 'GU', name: 'Gujarati (ગુજરાતી)' },
    { code: 'KN', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ML', name: 'Malayalam (മലയാളം)' },
    { code: 'PA', name: 'Punjabi (ਪੰਜਾਬੀ)' }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 hidden xs:flex">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{selectedLanguage}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setSelectedLanguage(language.code)}
            className={selectedLanguage === language.code ? 'bg-accent' : ''}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
