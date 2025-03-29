import { AutoSaveConfig } from "./types";

export function validateConfig(config: AutoSaveConfig) {
    const {
      formKey,
      storageType = 'localStorage',
      saveFunction,
      formData,
      control,
    } = config;

    if (!formKey || typeof formKey !== 'string') {
      throw new Error('[useFormAutoSave]: "formKey" is required and must be a non-empty string.');
    }

    if (!formData && !control) {
      throw new Error('[useFormAutoSave]: Either "formData" or "control" must be provided.');
    }

    if (storageType === 'api' && typeof saveFunction !== 'function') {
      throw new Error('[useFormAutoSave]: When "storageType" is "api", a valid "saveFunction" must be provided.');
    }

    if (storageType !== 'api' && saveFunction) {
      console.warn('[useFormAutoSave]: "saveFunction" provided but storageType is not "api". "saveFunction" will be ignored.');
    }
  }
