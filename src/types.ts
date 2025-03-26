import { Control } from 'react-hook-form';

export type StorageType = 'localStorage' | 'sessionStorage' | 'api';
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
  debug?: boolean;
};
