
import { useEffect, useState, useCallback } from 'react';

type StorageType = "localStorage" | "sessionStorage" | "api";

type SaveFunction = (formData: object) => Promise<void>;

type ErrorCallback = (error: any) => void;

export const useFormAutoSave = ({
  formData,
  formKey,
  debounceTime = 1000,
  storageType = "localStorage",
  saveFunction,
  onError,
  maxRetries = 3,
}: {
  formData: object;
  formKey: string;
  debounceTime?: number;
  storageType?: StorageType;
  saveFunction?: SaveFunction;
  onError?: ErrorCallback;
  maxRetries?: number;
}) => {
  const [lastSavedData, setLastSavedData] = useState<object | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaveSuccessful, setIsSaveSuccessful] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isAutoSavePaused, setIsAutoSavePaused] = useState<boolean>(false);

  const resumeAutoSave = useCallback(() => {
    setRetryCount(0);
    setIsAutoSavePaused(false);
  }, []);

  useEffect(() => {
    if (!formData || !formKey || isAutoSavePaused) return;
    if (Object.keys(formData).length === 0) return;

    if (lastSavedData && JSON.stringify(lastSavedData) === JSON.stringify(formData)) {
      console.log("Skipping save: No changes detected.");
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setIsSaving(true);
        setIsSaveSuccessful(false);

        if (storageType === "api" && saveFunction) {
          await saveFunction(formData);
        } else {
          const storage = storageType === "localStorage" ? localStorage : sessionStorage;
          storage.setItem(formKey, JSON.stringify(formData));
        }

        setLastSavedData(formData);
        setRetryCount(0);
        setIsSaveSuccessful(true);
      } catch (error) {
        console.error("Auto-save error:", error);
        if (onError) onError(error);

        if (retryCount < maxRetries) {
          const retryDelay = Math.pow(2, retryCount) * 1000;
          console.warn(`Retrying save in ${retryDelay / 1000}s...`);
          setTimeout(() => setRetryCount(retryCount + 1), retryDelay);
        } else {
          console.error("Max retries reached for this data. Waiting for new changes.");
          setIsAutoSavePaused(true);
        }
      } finally {
        setIsSaving(false);
      }
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [formData, formKey, debounceTime, storageType, saveFunction, onError, retryCount, isAutoSavePaused]);

  const restoreFormData = () => {
    if (storageType === "api") {
      console.warn("Restore functionality is not available for API storage.");
      return null;
    }
    const storage = storageType === "localStorage" ? localStorage : sessionStorage;
    const savedData = storage.getItem(formKey);
    return savedData ? JSON.parse(savedData) : null;
  };

  return { restoreFormData, isSaving, isSaveSuccessful, isAutoSavePaused, resumeAutoSave };
};