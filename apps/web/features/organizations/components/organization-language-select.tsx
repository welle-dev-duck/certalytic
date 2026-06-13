"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrganizationLanguageOptions,
  type OrganizationLanguage,
} from "@/lib/i18n/organization-language";

type OrganizationLanguageSelectProps = {
  id?: string;
  value: OrganizationLanguage;
  onValueChange: (value: OrganizationLanguage) => void;
  disabled?: boolean;
  placeholder: string;
};

export function OrganizationLanguageSelect({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder,
}: OrganizationLanguageSelectProps) {
  const options = getOrganizationLanguageOptions();

  return (
    <Select
      value={value}
      onValueChange={(nextValue) =>
        onValueChange(nextValue as OrganizationLanguage)
      }
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.code} value={option.code}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
