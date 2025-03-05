import { useEffect } from 'react';

type StorageType = "localStorage" | "sessionStorage";

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
  storageType: StorageType = "localStorage"
) => {
  useEffect(() => {
    if (!formData || !formKey) return;

    if (Object.keys(formData).length === 0) return;

    const handler = setTimeout(() => {
      const storage = storageType === "localStorage" ? localStorage : sessionStorage;
      storage.setItem(formKey, JSON.stringify(formData));
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [formData, formKey, debounceTime, storageType]);

  const restoreFormData = () => {
    const storage = storageType === "localStorage" ? localStorage : sessionStorage;
    const savedData = storage.getItem(formKey);
    return savedData ? JSON.parse(savedData) : null;
  };

  return { restoreFormData };
};
