// src/admin/hooks/useDirtyState.ts
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to track dirty state and warn before navigation with unsaved changes.
 *
 * @param currentData - Current form data
 * @param isLoading - Whether data is still loading (skip comparison while loading)
 * @param resetKey - Optional key that triggers a reset when it changes (e.g., itemId)
 * @returns Object with isDirty flag and markClean function
 */
export function useDirtyState<T>(
  currentData: T,
  isLoading: boolean,
  resetKey?: string
): {
  isDirty: boolean;
  markClean: () => void;
} {
  const [savedData, setSavedData] = useState<T | null>(null);
  const initialLoadRef = useRef(true);

  // Track when data is first loaded (after loading completes)
  useEffect(() => {
    if (!isLoading && initialLoadRef.current) {
      setSavedData(currentData);
      initialLoadRef.current = false;
    }
  }, [currentData, isLoading]);

  // Reset when resetKey changes (e.g., navigating to different item)
  useEffect(() => {
    initialLoadRef.current = true;
    setSavedData(null);
  }, [resetKey]);

  // Compare current data with saved data
  const isDirty =
    !isLoading &&
    savedData !== null &&
    JSON.stringify(currentData) !== JSON.stringify(savedData);

  // Mark current state as clean (after save)
  const markClean = useCallback(() => {
    setSavedData(currentData);
  }, [currentData]);

  // Warn on browser close/refresh
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return { isDirty, markClean };
}

/**
 * Hook to block navigation when dirty.
 * Returns a function that should be called before navigation.
 *
 * @param isDirty - Whether there are unsaved changes
 * @param message - Custom message to show (optional)
 * @returns Function that returns true if navigation should proceed
 */
export function useNavigationGuard(
  isDirty: boolean,
  message = "You have unsaved changes. Are you sure you want to leave?"
): () => boolean {
  return useCallback(() => {
    if (isDirty) {
      return window.confirm(message);
    }
    return true;
  }, [isDirty, message]);
}
