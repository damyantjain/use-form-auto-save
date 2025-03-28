/**
 * useFormAutoSave - Custom React Hook for automatically saving form data.
 *
 * This hook provides an efficient and customizable solution to automatically save form data
 * to either localStorage, sessionStorage, or an external API, based on your preference.
 * It supports debouncing, error handling, automatic retry mechanisms, and form restoration.
 *
 * @param {AutoSaveConfig} config - Configuration object to customize hook behavior.
 *
 * @property {string} config.formKey - A unique key identifying the form data for storage/retrieval.
 * @property {object} [config.formData] - Form data object (use when manually handling form state).
 * @property {Control<any>} [config.control] - React Hook Form control object (use with React Hook Form).
 * @property {number} [config.debounceTime=1000] - Delay in milliseconds before auto-save triggers after changes.
 * @property {"localStorage"|"sessionStorage"|"api"} [config.storageType="localStorage"] - Storage medium.
 * @property {SaveFunction} [config.saveFunction] - Custom asynchronous function for API-based saving.
 * @property {ErrorCallback} [config.onError] - Callback triggered on save error.
 * @property {number} [config.maxRetries=3] - Number of retry attempts on failure before pausing auto-save.
 * @property {boolean} [config.skipInitialSave=false] - Skip auto-saving on initial render.
 * @property {boolean} [config.debug=false] - Enable debug logging for the hook.
 *
 * @returns {object} Object containing methods and state for managing auto-save functionality:
 *   - restoreFormData(): Function to retrieve saved form data (null if using API storage).
 *   - resumeAutoSave(): Function to manually resume auto-save if paused after retries.
 *   - isSaving: Indicates if auto-save is currently in progress.
 *   - isSaveSuccessful: Indicates if the last auto-save operation was successful.
 *   - isAutoSavePaused: Indicates if auto-save is paused due to consecutive errors.
 *   - setLastSavedData: Function to manually update the internally tracked last saved data.
 *
 * @example
 * // Basic usage with localStorage
 * const { restoreFormData, isSaving } = useFormAutoSave({
 *   formKey: 'userForm',
 *   formData: formState,
 * });
 *
 * @example
 * // Advanced usage with API storage and error handling
 * const { isSaveSuccessful, resumeAutoSave } = useFormAutoSave({
 *   formKey: 'userProfile',
 *   control,
 *   storageType: 'api',
 *   debounceTime: 2000,
 *   saveFunction: async (data) => await apiClient.saveUserProfile(data),
 *   onError: (err) => toast.error("Auto-save failed."),
 *   maxRetries: 5,
 * });
 *
 * @note
 * - When using 'api' storage type, you must provide a `saveFunction`.
 * - `restoreFormData` is not available when using 'api' storage type.
 * - The hook automatically pauses auto-save after exhausting retries; use `resumeAutoSave` to restart.
 *
 * @author Damyant Jain (https://github.com/damyantjain)
 * @license MIT
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import isEqual from 'lodash.isequal';
import { useSaveHandler } from './useSaveHandler';
import { AutoSaveConfig } from './types';
import { useRetryHandler } from './useRetryHandler';


export const useFormAutoSave = (config: AutoSaveConfig) => {
  const {
    formKey,
    debounceTime = 1000,
    storageType = 'localStorage',
    saveFunction,
    onError,
    maxRetries = 3,
    skipInitialSave = false,
    debug = false,
  } = config;

  if (!('formData' in config) && !('control' in config)) {
    console.warn(
      '[useFormAutoSave] You must provide either "formData" (manual) or "control" (React Hook Form). Auto-save will not run.'
    );
  }

  const watchedFormState = config.control
    ? useWatch({ control: config.control })
    : config.formData;

  const logDebug = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log('[useFormAutoSave]', ...args);
      }
    },
    [debug]
  );

  const [lastSavedData, setLastSavedData] = useState<object | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaveSuccessful, setIsSaveSuccessful] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isAutoSavePaused, setIsAutoSavePaused] = useState<boolean>(false);
  const [shouldRetry, setShouldRetry] = useState<boolean>(false);

  const hasMounted = useRef(false);

  const resumeAutoSave = useCallback(() => {
    logDebug('Manually resuming auto-save.');
    setRetryCount(0);
    setIsAutoSavePaused(false);
    setShouldRetry(false);
  }, [logDebug]);

  const shouldSkipAutoSave = () => {
    if (!watchedFormState || !formKey || isAutoSavePaused) {
      logDebug('Auto-save skipped: missing form state/key or paused.');
      return true;
    }

    if (Object.keys(watchedFormState).length === 0) {
      logDebug('Auto-save skipped: empty form state.');
      return true;
    }

    if (!hasMounted.current) {
      hasMounted.current = true;
      if (skipInitialSave) {
        logDebug('Auto-save skipped: initial save skipped.');
        return true;
      }
    }

    if (lastSavedData && isEqual(lastSavedData, watchedFormState)) {
      logDebug('Auto-save skipped: data unchanged.');
      return true;
    }

    return false;
  };

  const { performSave } = useSaveHandler({
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
  });

  useEffect(() => {
    logDebug('Effect triggered.');

    if (shouldSkipAutoSave()) return;

    const handler = setTimeout(() => {
      performSave(watchedFormState);
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [
    watchedFormState,
    formKey,
    debounceTime,
    storageType,
    saveFunction,
    onError,
    retryCount,
    isAutoSavePaused,
    skipInitialSave,
    lastSavedData,
    logDebug,
    performSave,
  ]);

  useRetryHandler({
    shouldRetry,
    retryCount,
    maxRetries,
    logDebug,
    onRetry: () => {
      setShouldRetry(false);
      setRetryCount((prev) => prev + 1);
    },
  });
  
  const restoreFormData = () => {
    if (storageType === 'api') {
      logDebug('Restore functionality is unavailable for API storage.');
      console.warn('Restore functionality is not available for API storage.');
      return null;
    }
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
    const savedData = storage.getItem(formKey);
    logDebug('Restoring form data:', savedData);
    return savedData ? JSON.parse(savedData) : null;
  };

  return {
    restoreFormData,
    isSaving,
    isSaveSuccessful,
    isAutoSavePaused,
    resumeAutoSave,
    setLastSavedData,
  };
};
