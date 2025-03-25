import { useCallback } from 'react';
import type { SaveFunction, ErrorCallback, StorageType } from './types';


export function useSaveHandler({
  formKey,
  storageType,
  saveFunction,
  onError,
  maxRetries,
  logDebug,
  retryCount,
  setRetryCount,
  setShouldRetry,
  setIsAutoSavePaused,
  setIsSaving,
  setIsSaveSuccessful,
  setLastSavedData,
}: {
  formKey: string;
  storageType: StorageType;
  saveFunction?: SaveFunction;
  onError?: ErrorCallback;
  maxRetries: number;
  logDebug: (...args: any[]) => void;
  retryCount: number;
  setRetryCount: React.Dispatch<React.SetStateAction<number>>;
  setShouldRetry: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAutoSavePaused: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaveSuccessful: React.Dispatch<React.SetStateAction<boolean>>;
  setLastSavedData: (data: object) => void;
}) {
  const performSave = useCallback(
    async (formData: object) => {
      logDebug(`Initiating auto-save for formKey: ${formKey}`);
      try {
        setIsSaving(true);
        setIsSaveSuccessful(false);

        if (storageType === 'api' && saveFunction) {
          logDebug('Saving via API:', formData);
          await saveFunction(formData);
        } else {
          try {
            const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
            logDebug(`Saving to ${storageType}:`, formData);
            storage.setItem(formKey, JSON.stringify(formData));
          } catch (storageError) {
            logDebug('Storage save failed:', storageError);
            if (onError) onError(storageError);
            if (retryCount < maxRetries) {
              setShouldRetry(true);
            } else {
              setIsAutoSavePaused(true);
            }
            return;
          }
        }

        setLastSavedData(formData);
        setRetryCount(0);
        setIsSaveSuccessful(true);
        setShouldRetry(false);
        logDebug('Auto-save successful.');
      } catch (error) {
        logDebug('Auto-save encountered an error:', error);
        if (onError) onError(error);
        if (retryCount < maxRetries) {
          setShouldRetry(true);
        } else {
          setIsAutoSavePaused(true);
          logDebug(`Auto-save paused after ${maxRetries} retries.`);
        }
      } finally {
        setIsSaving(false);
        logDebug('Auto-save operation completed.');
      }
    },
    [
      formKey,
      logDebug,
      maxRetries,
      onError,
      retryCount,
      saveFunction,
      setIsAutoSavePaused,
      setIsSaveSuccessful,
      setIsSaving,
      setLastSavedData,
      setRetryCount,
      setShouldRetry,
      storageType,
    ]
  );

  return { performSave };
}
