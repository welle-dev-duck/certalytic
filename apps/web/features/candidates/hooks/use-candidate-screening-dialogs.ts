"use client";

import { useCallback, useState } from "react";

type SelectedCandidate = {
  id: string;
  name: string;
};

export function useCandidateScreeningDialogs() {
  const [screenOpen, setScreenOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rerunOpen, setRerunOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<SelectedCandidate | null>(null);

  const clearSelectedCandidate = useCallback(() => {
    setSelectedCandidate(null);
  }, []);

  const openDelete = useCallback((candidate: SelectedCandidate) => {
    setSelectedCandidate(candidate);
    setDeleteOpen(true);
  }, []);

  const openRerun = useCallback((candidate: SelectedCandidate) => {
    setSelectedCandidate(candidate);
    setRerunOpen(true);
  }, []);

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    setDeleteOpen(open);
    if (!open) {
      setSelectedCandidate(null);
    }
  }, []);

  const handleRerunOpenChange = useCallback((open: boolean) => {
    setRerunOpen(open);
    if (!open) {
      setSelectedCandidate(null);
    }
  }, []);

  return {
    screenOpen,
    setScreenOpen,
    deleteOpen,
    rerunOpen,
    selectedCandidate,
    openDelete,
    openRerun,
    handleDeleteOpenChange,
    handleRerunOpenChange,
  };
}
