import React from "react";
import { useForm } from "react-hook-form";
import { useFormAutoSave } from "../src/useFormAutoSave";

export const ReactHookFormTest = () => {
  const { control, register } = useForm({
    defaultValues: { name: "", email: "" },
  });

  useFormAutoSave({}, "react-hook-form-test", 2000, "localStorage", undefined, undefined, 3, control);

  return (
    <div>
      <h2>React Hook Form Auto-Save Test</h2>
      <input {...register("name")} placeholder="Namee" />
      <input {...register("email")} placeholder="Email" />
    </div>
  );
};
