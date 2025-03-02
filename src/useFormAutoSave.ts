import { useEffect } from 'react';
/**
 * Basic version of useFormAutoSave hook.
 * Automatically saves form data to localStorage.
 * Restores saved data on component mount.
 *
 * @param formData - The form state to be saved.
 * @param formKey - Unique key to identify saved form data.
 * @param debounceTime - Time delay before saving (default: 1000ms).
 */
export const useFormAutoSave = (formData: object, formKey: string, debounceTime = 1000) => {
  useEffect(() => {
    if (!formData || !formKey) return;

    const handler = setTimeout(() => {
      localStorage.setItem(formKey, JSON.stringify(formData));
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [formData, formKey, debounceTime]);

  const restoreFormData = () => {
    const savedData = localStorage.getItem(formKey);
    return savedData ? JSON.parse(savedData) : null;
  };

  return { restoreFormData };
};
