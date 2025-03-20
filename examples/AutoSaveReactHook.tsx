import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useFormAutoSave } from "../src/useFormAutoSave";

export const AutoSaveReactHook = () => {
  const { control, register, reset, watch } = useForm({
    defaultValues: { name: "", email: "" },
  });

  const { restoreFormData, setLastSavedData } = useFormAutoSave({
    control,
    formKey: "react-hook-form-user-form",
    debounceTime: 1000,
    storageType: "sessionStorage",
    skipInitialSave: true
  });

  useEffect(() => {
    const savedData = restoreFormData();
    if (savedData) {
      reset(savedData);
      setLastSavedData(savedData);
    }
  }, []);

  return (
    <div>
      <h2>Auto-Saving Form (React Hook Form + Session Storage)</h2>
      <input {...register("name")} placeholder="Name" />
      <input {...register("email")} placeholder="Email" />
      <p>Data is automatically saved every second to <b>sessionStorage</b>.</p>
    </div>
  );
};
