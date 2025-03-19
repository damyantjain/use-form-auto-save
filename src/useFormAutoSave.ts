import { useEffect, useState, useCallback, useRef } from 'react';
import { useWatch, Control } from "react-hook-form";


type StorageType = "localStorage" | "sessionStorage" | "api";
type SaveFunction = (formData: object) => Promise<void>;
type ErrorCallback = (error: any) => void;

/**
 * Automatically persists form data to a specified storage mechanism with debouncing and retry logic.
 *
 * This hook watches for changes in the provided form data and, after a specified debounce delay, saves the data to
 * the chosen storage type. If the storageType is "api", a custom asynchronous saveFunction must be provided.
 * Local and session storage are supported, and automatic data restoration is available (except when using "api" storage).
 *
 * @remarks
 * - Saves are skipped if no changes are detected compared to the last saved state.
 * - On failure, the hook automatically retries the save operation up to maxRetries times using an exponential backoff strategy.
 * - The restoreFormData method is provided to retrieve saved form data (not available for "api" storage).
 *
 * @param formData - The current form state as an object. This is used when a React Hook Form control is not provided.
 * @param formKey - A unique key used for saving and retrieving the form data.
 * @param control - An optional React Hook Form control to watch for changes in the form data.
 * @param debounceTime - The delay in milliseconds before triggering the save; defaults to 1000ms.
 * @param storageType - The mechanism for data storage: "localStorage", "sessionStorage", or "api"; defaults to "localStorage".
 * @param saveFunction - An optional asynchronous function for saving data when using "api" storage. It should return a Promise.
 * @param onError - An optional callback invoked with the error in case the save operation fails.
 * @param maxRetries - The maximum number of retry attempts after a failed save; defaults to 3.
 *
 * @returns An object containing:
 * - restoreFormData: A function to retrieve and parse the saved form data (unavailable for "api" storage).
 * - isSaving: A boolean indicating if the auto-save process is in progress.
 * - isSaveSuccessful: A boolean flag that shows if the last save operation succeeded.
 * - isAutoSavePaused: A boolean indicating whether auto-save is paused due to repeated failures.
 * - resumeAutoSave: A function to reset the retry count and re-enable auto-saving after it has been paused.
 *
 * @example
 * const { restoreFormData, isSaving, isSaveSuccessful, isAutoSavePaused, resumeAutoSave } =
 *   useFormAutoSave({
 *     formData: { name: 'John Doe', email: 'john@example.com' },
 *     formKey: 'user-profile',
 *     control: formControl, // optional: only if using react-hook-form
 *     debounceTime: 1000,
 *     storageType: 'localStorage',
 *     saveFunction: async (data) => {
 *       await apiSave(data);
 *     },
 *     onError: (err) => console.error('Save error: ', err),
 *     maxRetries: 3,
 *   });
 */
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveSuccessful, setIsSaveSuccessful] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoSavePaused, setIsAutoSavePaused] = useState(false);

  const resumeAutoSave = useCallback(() => {
    setRetryCount(0);
    setIsAutoSavePaused(false);
  }, []);

  useEffect(() => {
    if (!formData || !formKey || isAutoSavePaused) return;
    if (Object.keys(formData).length === 0) return;

    // Skip if data is unchanged
    if (lastSavedData && JSON.stringify(lastSavedData) === JSON.stringify(formData)) return;

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
          setTimeout(() => setRetryCount(retryCount + 1), retryDelay);
        } else {
          setIsAutoSavePaused(true);
        }
      } finally {
        setIsSaving(false);
      }
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [formData, formKey, debounceTime, storageType, saveFunction, onError, retryCount, isAutoSavePaused, lastSavedData]);

  const restoreFormData = () => {
    if (storageType === "api") return null;
    const storage = storageType === "localStorage" ? localStorage : sessionStorage;
    const savedData = storage.getItem(formKey);
    return savedData ? JSON.parse(savedData) : null;
  };

  return {
    restoreFormData,
    isSaving,
    isSaveSuccessful,
    isAutoSavePaused,
    resumeAutoSave,
  };
};