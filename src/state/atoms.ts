"use client";

import { atom } from "jotai";

// UI atoms
export const mobileMenuOpenAtom = atom(false);

// Auth atoms
export type AuthState = {
  isAuthed: boolean | null;
  displayName: string | null;
  photoURL: string | null;
};

export const authStateAtom = atom<AuthState>({
  isAuthed: null,
  displayName: null,
  photoURL: null,
});


