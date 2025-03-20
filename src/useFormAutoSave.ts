import { useEffect, useState, useCallback, useRef } from 'react';
import { useWatch, Control } from "react-hook-form";

// Types
export type StorageType = "localStorage" | "sessionStorage" | "api";
export type SaveFunction = (formData: object) => Promise<void>;
export type ErrorCallback = (error: any) => void;

export type AutoSaveConfig =
  | ({
      formData: object;
      control?: never;
      skipInitialSave?: boolean;
    } & BaseConfig)
  | ({
      formData?: never;
      control: Control<any>;
      skipInitialSave?: boolean;
    } & BaseConfig);

export type BaseConfig = {
  formKey: string;
  debounceTime?: number;
  storageType?: StorageType;
  saveFunction?: SaveFunction;
  onError?: ErrorCallback;
  maxRetries?: number;
};

export const useFormAutoSave = (config: AutoSaveConfig) => {
  const {
    formKey,
    debounceTime = 1000,
    storageType = "localStorage",
    saveFunction,
    onError,
    maxRetries = 3,
    skipInitialSave = false
  } = config;

  const watchedFormState = config.control
    ? useWatch({ control: config.control })
    : config.formData;

  const [lastSavedData, setLastSavedData] = useState<object | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaveSuccessful, setIsSaveSuccessful] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isAutoSavePaused, setIsAutoSavePaused] = useState<boolean>(false);

  const hasMounted = useRef(false);

  const resumeAutoSave = useCallback(() => {
    setRetryCount(0);
    setIsAutoSavePaused(false);
  }, []);

  useEffect(() => {
    console.log("rerendered");
    if (!watchedFormState || !formKey || isAutoSavePaused) return;
    if (Object.keys(watchedFormState).length === 0) return;

    if (!hasMounted.current) {
      hasMounted.current = true;
      if (skipInitialSave) return;
    }

    if (lastSavedData && JSON.stringify(lastSavedData) === JSON.stringify(watchedFormState)) {
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setIsSaving(true);
        setIsSaveSuccessful(false);

        if (storageType === "api" && saveFunction) {
          await saveFunction(watchedFormState);
        } else {
          const storage = storageType === "localStorage" ? localStorage : sessionStorage;
          storage.setItem(formKey, JSON.stringify(watchedFormState));
        }

        setLastSavedData(watchedFormState);
        setRetryCount(0);
        setIsSaveSuccessful(true);
      } catch (error) {
        console.error("Auto-save error:", error);
        if (onError) onError(error);

        if (retryCount < maxRetries) {
          const retryDelay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => setRetryCount(retryCount + 1), retryDelay);
        } else {
          setIsAutoSavePaused(true);
        }
      } finally {
        setIsSaving(false);
      }
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [watchedFormState, formKey, debounceTime, storageType, saveFunction, onError, retryCount, isAutoSavePaused, skipInitialSave]);

  const restoreFormData = () => {
    if (storageType === "api") {
      console.warn("Restore functionality is not available for API storage.");
      return null;
    }
    const storage = storageType === "localStorage" ? localStorage : sessionStorage;
    const savedData = storage.getItem(formKey);
    return savedData ? JSON.parse(savedData) : null;
  };

  return { restoreFormData, isSaving, isSaveSuccessful, isAutoSavePaused, resumeAutoSave, setLastSavedData };
};