"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getCountryName,
  getCountryOptions,
} from "@/lib/i18n/countries";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type CountryComboboxProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
};

export function CountryCombobox({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  searchPlaceholder,
  emptyMessage,
}: CountryComboboxProps) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);

  const options = useMemo(() => getCountryOptions(locale), [locale]);
  const selectedLabel = value ? getCountryName(value, locale) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.code}
                  value={`${option.name} ${option.code}`}
                  onSelect={() => {
                    onValueChange(option.code);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "size-4",
                      value === option.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
