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
import type { RoleOption } from "@/features/roles/types";
import { cn } from "@/lib/utils";

type RoleComboboxProps = {
  id?: string;
  value: string | null;
  onValueChange: (value: string) => void;
  roles: RoleOption[];
  disabled?: boolean;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
};

export function RoleCombobox({
  id,
  value,
  onValueChange,
  roles,
  disabled = false,
  placeholder,
  searchPlaceholder,
  emptyMessage,
}: RoleComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => roles.find((role) => role.id === value)?.title ?? null,
    [roles, value],
  );

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
          <span className="truncate">{selectedLabel ?? placeholder}</span>
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
              {roles.map((role) => (
                <CommandItem
                  key={role.id}
                  value={`${role.title} ${role.id}`}
                  onSelect={() => {
                    onValueChange(role.id);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "size-4",
                      value === role.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {role.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
