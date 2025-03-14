
import { useEffect, useState, useCallback } from 'react';
import { useWatch, Control } from "react-hook-form";


type StorageType = "localStorage" | "sessionStorage" | "api";

type SaveFunction = (formData: object) => Promise<void>;

type ErrorCallback = (error: any) => void;

/**
 * Automatically persists form data to a specified storage mechanism with debouncing and retry logic.
 *
 * This hook monitors changes in the provided form data and, after a debounce delay, saves the data to the
 * chosen storage type. If storageType is set to "api", a custom asynchronous saveFunction must be provided.
 * Local and session storage are supported, with automatic data restoration available (except when using "api" storage).
 *
 * @remarks
 * - If no changes are detected compared to the last saved state, the save operation is skipped.
 * - On failure, the hook will automatically retry the save operation up to a specified number of times,
 *   using an exponential backoff strategy.
 * - The hook provides a restoreFormData helper to retrieve saved form data (except when storageType is "api").
 *
 * @param formData - The current form state to be saved as an object. Must be non-empty.
 * @param formKey - A unique key string used to store and retrieve the form data.
 * @param debounceTime - The delay in milliseconds before saving changes; defaults to 1000ms.
 * @param storageType - The storage mechanism to be used: "localStorage", "sessionStorage", or "api"; defaults to "localStorage".
 * @param saveFunction - An optional asynchronous function that handles saving when using "api" storage.
 *                       It should return a Promise that resolves when the save operation is successful.
 * @param onError - An optional callback function that is invoked with the error if the save operation fails.
 * @param maxRetries - The maximum number of retry attempts to handle a failed save operation; defaults to 3.
 *
 * @returns An object containing:
 * - restoreFormData: A function to restore and parse the saved form data from storage. (Not available for "api" storage.)
 * - isSaving: A boolean value indicating whether the auto-save process is currently in progress.
 * - isAutoSavePaused: A boolean value indicating whether the auto-save process is paused due to repeated failures.
 * - resumeAutoSave: A function to reset the retry count and resume the auto-save process after it has been paused.
 *
 * @example
 * const { restoreFormData, isSaving, retryCount } = useFormAutoSave(formData, 'myFormKey', 1000, 'localStorage');
 */
export const useFormAutoSave = (
  formData: object | null,
  formKey: string,
  debounceTime = 1000,
  storageType: StorageType = "localStorage",
  saveFunction?: SaveFunction,
  onError?: ErrorCallback,
  maxRetries = 3,
  control?: Control<any> 
) => {
  const [lastSavedData, setLastSavedData] = useState<object | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaveSuccessful, setIsSaveSuccessful] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isAutoSavePaused, setIsAutoSavePaused] = useState<boolean>(false);

  const watchedFormState = control ? useWatch({ control }) : formData;

  const resumeAutoSave = useCallback(() => {
    setRetryCount(0);
    setIsAutoSavePaused(false);
  }, []);

  useEffect(() => {
    console.log("yo")
    if (!watchedFormState || !formKey || isAutoSavePaused) return;
    if (Object.keys(watchedFormState).length === 0) return;
    console.log("yoooo")
    if (lastSavedData && JSON.stringify(lastSavedData) === JSON.stringify(watchedFormState)) {
      console.log("Skipping save: No changes detected.");
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
  }, [watchedFormState, formKey, debounceTime, storageType, saveFunction, onError, retryCount, isAutoSavePaused]);

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