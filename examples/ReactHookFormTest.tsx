import React from "react";
import { useForm } from "react-hook-form";
import { useFormAutoSave } from "../src/useFormAutoSave";

export const ReactHookFormTest = () => {
  const { control, register, reset } = useForm({
    defaultValues: { name: "", email: "" },
  });

  const { restoreFormData } = useFormAutoSave({
    formData: null,
    formKey: "react-hook-form-test",
    debounceTime: 1000,
    control,
    storageType: "localStorage"
  });

  React.useEffect(() => {
    const saved = restoreFormData();
    if (saved) {
      reset(saved);
    }
  }, [restoreFormData, reset]);

  return (
    <div>
      <h2>React Hook Form Auto-Save Test</h2>
      <input {...register("name")} placeholder="Name" />
      <input {...register("email")} placeholder="Email" />
    </div>
  );
};
