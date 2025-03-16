import React from "react";
import { useForm } from "react-hook-form";
import { useFormAutoSave } from "../src/useFormAutoSave";

export const ReactHookFormTest = () => {
  const { control, register } = useForm({
    defaultValues: { name: "", email: "" },
  });

  useFormAutoSave({
    formData: {},
    formKey: "react-hook-form-test",
    debounceTime: 2000,
    storageType: "localStorage",
    control,
  });

  return (
    <div>
      <h2>React Hook Form Auto-Save Test</h2>
      <input {...register("name")} placeholder="Name" />
      <input {...register("email")} placeholder="Email" />
    </div>
  );
};
