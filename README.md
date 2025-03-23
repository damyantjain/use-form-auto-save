# useFormAutoSave

[![npm](https://img.shields.io/npm/v/use-form-auto-save)](https://www.npmjs.com/package/use-form-auto-save)

> A custom React hook to automatically save form data seamlessly to localStorage, sessionStorage, or an external API, featuring debouncing, error handling, retry mechanisms, and restoration capabilities. It also integrates smoothly with React Hook Form.

---

## Features

- Auto-save form data with customizable debounce delay.
- Flexible storage options:
  - Local Storage
  - Session Storage
  - External APIs
- Robust error handling with automatic retry mechanisms.
- Form data restoration from local/session storage.
- Comprehensive debug logging for troubleshooting.
- Works seamlessly with React Hook Form.

---

## Installation

```bash
npm install your-package-name
# or
yarn add your-package-name
```

---

## Usage

### Basic Example (Local Storage)

```jsx
import React, { useState } from "react";
import { useFormAutoSave } from "your-package-name";

const FormComponent = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const { isSaving } = useFormAutoSave({
    formKey: "user-form",
    formData,
    debounceTime: 1000,
  });

  return (
    <>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <p>{isSaving ? "Saving..." : "Saved"}</p>
    </>
  );
};
```

### Advanced Example (API Integration)

```jsx
import React, { useState } from "react";
import { useFormAutoSave } from "your-package-name";
import { toast } from "react-toastify";
import apiClient from "./apiClient";

const FormWithApi = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const { isSaveSuccessful, resumeAutoSave, isAutoSavePaused } = useFormAutoSave({
    formKey: "userProfile",
    formData,
    storageType: "api",
    debounceTime: 2000,
    saveFunction: async (data) => await apiClient.saveUserProfile(data),
    onError: (err) => toast.error("Auto-save failed."),
    maxRetries: 5,
    debug: true,
  });

  return (
    <>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      {isAutoSavePaused && <button onClick={resumeAutoSave}>Retry Auto-Save</button>}
      <p>{isSaveSuccessful ? "All changes saved!" : "Saving failed."}</p>
    </>
  );
};
```

### Additional Examples

Persist form data in session storage:

```jsx
useFormAutoSave({ formKey: 'session-form', formData, storageType: 'sessionStorage' });
```

Persist form using React Hook Form:

```jsx
useFormAutoSave({ formKey: 'rhf-form', control });
```

Enable debug logging:

```jsx
useFormAutoSave({ formKey: 'debug-form', formData, debug: true });
```

Persist form data with a custom debounce interval:

```jsx
useFormAutoSave({ formKey: 'debounced-form', formData, debounceTime: 3000 });
```

Persist form data to an API with error handling:

```jsx
useFormAutoSave({
  formKey: 'api-form',
  formData,
  storageType: 'api',
  saveFunction: async (data) => await apiClient.save(data),
  onError: (error) => console.error("Auto-save error:", error)
});
```

Pause auto-saving on initial render:

```jsx
useFormAutoSave({ formKey: 'skip-initial', formData, skipInitialSave: true });
```

---

## API Reference

### Config Options (`AutoSaveConfig`)
- `formKey` *(string, required)* - Unique identifier for the form.
- `formData` *(object)* - Form data for manual handling.
- `control` *(Control<any>)* - React Hook Form control object.
- `debounceTime` *(number)* - Delay before saving after changes (default: `1000`).
- `storageType` *("localStorage" | "sessionStorage" | "api")* - Storage medium (default: `"localStorage"`).
- `saveFunction` *(function)* - Custom async save function for APIs.
- `onError` *(function)* - Callback on save error.
- `maxRetries` *(number)* - Max retry attempts (default: `3`).
- `skipInitialSave` *(boolean)* - Skip auto-saving on initial render (default: `false`).
- `debug` *(boolean)* - Enable debug logging (default: `false`).

### Returned Values & Methods
- `restoreFormData()` - Retrieve stored form data (local/session storage only).
- `resumeAutoSave()` - Resume auto-saving if paused after retries.
- `isSaving` *(boolean)* - Indicates saving status.
- `isSaveSuccessful` *(boolean)* - Indicates last save success status.
- `isAutoSavePaused` *(boolean)* - Indicates if auto-save is paused.
- `setLastSavedData(data)` - Update internal tracking of last saved data.

---

## Important Notes & Best Practices

- API storage requires a `saveFunction`.
- `restoreFormData` is unavailable for API storage.
- Choose appropriate debounce intervals based on form complexity and user interactions.
- Regularly test error-handling mechanisms to ensure reliability.

---

## License

Released under the [MIT License](./LICENSE).