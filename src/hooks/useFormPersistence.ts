'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to persist form data across page refreshes using sessionStorage.
 * Data is cleared when clearForm() is called (usually after successful submit).
 * 
 * @param key - Unique key for this form's storage
 * @param initialState - Default form values
 * @returns [formState, setFormState, clearForm]
 */
export function useFormPersistence<T extends object>(
  key: string,
  initialState: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const storageKey = `form_persist_${key}`;
  
  // Initialize state - try to restore from sessionStorage
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialState;
    
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with initial state to handle new fields
        return { ...initialState, ...parsed };
      }
    } catch (e) {
      console.warn('[FormPersistence] Failed to restore from storage:', e);
    }
    return initialState;
  });

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn('[FormPersistence] Failed to save to storage:', e);
    }
  }, [state, storageKey]);

  // Clear form data from storage (call after successful submit)
  const clearForm = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('[FormPersistence] Failed to clear storage:', e);
    }
    setState(initialState);
  }, [storageKey, initialState]);

  return [state, setState, clearForm];
}

/**
 * Simpler hook for individual input fields
 * 
 * @param key - Unique key for this input
 * @param defaultValue - Default value
 * @returns [value, setValue, clear]
 */
export function useInputPersistence(
  key: string,
  defaultValue: string = ''
): [string, (value: string) => void, () => void] {
  const storageKey = `input_persist_${key}`;
  
  const [value, setValue] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      if (value) {
        sessionStorage.setItem(storageKey, value);
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.warn('[InputPersistence] Storage error:', e);
    }
  }, [value, storageKey]);

  const clear = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKey);
    }
    setValue(defaultValue);
  }, [storageKey, defaultValue]);

  return [value, setValue, clear];
}

/**
 * Hook for forms with server actions (uncontrolled inputs).
 * Automatically saves all form inputs on change and restores on mount.
 * 
 * @param formId - Unique identifier for the form
 * @returns { onInputChange, getDefaultValue, clearAll, containerRef }
 */
export function useUncontrolledFormPersistence(formId: string) {
  const storageKey = `uncontrolled_form_${formId}`;
  
  // Get stored values
  const getStoredValues = useCallback((): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, [storageKey]);

  // Save a single field
  const saveField = useCallback((name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      const current = getStoredValues();
      current[name] = value;
      sessionStorage.setItem(storageKey, JSON.stringify(current));
    } catch (e) {
      console.warn('[FormPersistence] Save error:', e);
    }
  }, [storageKey, getStoredValues]);

  // Get default value for a field
  const getDefaultValue = useCallback((name: string, fallback: string = ''): string => {
    const values = getStoredValues();
    return values[name] ?? fallback;
  }, [getStoredValues]);

  // Handler for input changes
  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name) saveField(name, value);
  }, [saveField]);

  // Clear all stored values
  const clearAll = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Auto-attach listeners to form (optional ref approach)
  const containerRef = useCallback((node: HTMLFormElement | null) => {
    if (!node) return;
    
    // Restore values on mount
    const inputs = node.querySelectorAll('input, textarea, select');
    const values = getStoredValues();
    
    inputs.forEach((input) => {
      const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (el.name && values[el.name] && el.type !== 'password') {
        el.value = values[el.name];
      }
    });

    // Attach change listeners
    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target.name && target.type !== 'password') {
        saveField(target.name, target.value);
      }
    };

    node.addEventListener('input', handleChange);
    return () => node.removeEventListener('input', handleChange);
  }, [getStoredValues, saveField]);

  return { onInputChange, getDefaultValue, clearAll, containerRef };
}
