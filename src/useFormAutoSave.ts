import { useEffect, useState } from 'react';

type StorageType = "localStorage" | "sessionStorage" | "api";

type SaveFunction = (formData: object) => Promise<void>;

type ErrorCallback = (error: any) => void;

/**
 * Basic version of useFormAutoSave hook.
 * Automatically saves form data to localStorage.
 * Restores saved data on component mount.
 *
 * @param formData - The form state to be saved.
 * @param formKey - Unique key to identify saved form data.
 * @param debounceTime - Time delay before saving (default: 1000ms).
 * @param storageType - Storage type to use (default: localStorage).
 */
export const useFormAutoSave = (
  formData: object,
  formKey: string,
  debounceTime = 1000,
  storageType: StorageType = "localStorage",
  saveFunction?: SaveFunction,
  onError?: ErrorCallback
) => {
  const [lastSavedData, setLastSavedData] = useState<object | null>(null);

  useEffect(() => {
    if (!formData || !formKey) return;
    if (Object.keys(formData).length === 0) return;

    if (lastSavedData && JSON.stringify(lastSavedData) === JSON.stringify(formData)) {
      console.log("Skipping save: No changes detected.");
      return;
    }

    const handler = setTimeout(async () => {
      try {
        if (storageType === "api" && saveFunction) {
          await saveFunction(formData);
        } else {
          const storage = storageType === "localStorage" ? localStorage : sessionStorage;
          storage.setItem(formKey, JSON.stringify(formData));
        }
        setLastSavedData(formData);
      } catch (error) {
        console.error("Auto-save error:", error);
        if (onError) onError(error);
      }
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [formData, formKey, debounceTime, storageType, saveFunction]);

  const restoreFormData = () => {
    if (storageType === "api") {
      console.warn("Restore functionality is not available for API storage.");
      return null;
    }
    const storage = storageType === "localStorage" ? localStorage : sessionStorage;
    const savedData = storage.getItem(formKey);
    return savedData ? JSON.parse(savedData) : null;
  };

  return { restoreFormData };
};