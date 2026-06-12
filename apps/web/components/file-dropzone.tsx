"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  id?: string;
  name?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  file?: File | null;
  files?: File[];
  onFileChange?: (file: File | null) => void;
  onFilesChange?: (files: File[]) => void;
  description?: string;
  className?: string;
  "aria-invalid"?: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  id,
  name,
  accept,
  multiple = false,
  disabled = false,
  file = null,
  files = [],
  onFileChange,
  onFilesChange,
  description = "Drag and drop a file here, or click to browse",
  className,
  "aria-invalid": ariaInvalid = false,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const applyFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      onFileChange?.(null);
      onFilesChange?.([]);
      return;
    }

    if (multiple) {
      const nextFiles = Array.from(fileList);
      setSelectedFiles(nextFiles);
      onFilesChange?.(nextFiles);
      return;
    }

    const nextFile = fileList[0] ?? null;
    setSelectedFiles(nextFile ? [nextFile] : []);
    onFileChange?.(nextFile);
  };

  const handleInputChange = () => {
    applyFiles(inputRef.current?.files ?? null);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (!disabled) applyFiles(event.dataTransfer.files);
  };

  const clearFile = (event: MouseEvent) => {
    event.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    setSelectedFiles([]);
    onFileChange?.(null);
    onFilesChange?.([]);
  };

  useEffect(() => {
    if (multiple) {
      setSelectedFiles(files);
      if (files.length === 0 && inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    if (file === null) {
      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [file, files, multiple]);

  const activeFile = multiple ? null : (file ?? selectedFiles[0] ?? null);
  const activeFileCount = multiple ? selectedFiles.length : activeFile ? 1 : 0;

  return (
    <div className={cn("grid gap-2", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-invalid={ariaInvalid}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
          "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/35",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none",
          isDragging && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          ariaInvalid && "border-destructive ring-destructive/20",
        )}
      >
        {activeFileCount > 0 ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {multiple
                  ? `${activeFileCount} file${activeFileCount === 1 ? "" : "s"} selected`
                  : activeFile?.name}
              </p>
              {!multiple && activeFile ? (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(activeFile.size)}
                </p>
              ) : multiple && selectedFiles.length > 0 ? (
                <ul className="text-xs text-muted-foreground">
                  {selectedFiles.map((selectedFile) => (
                    <li key={`${selectedFile.name}-${selectedFile.size}`}>
                      {selectedFile.name}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground"
              onClick={clearFile}
              disabled={disabled}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Remove
            </Button>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Drop file to upload" : "Drop file here"}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  );
}
