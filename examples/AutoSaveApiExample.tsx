import React, { useState } from "react";
import { useFormAutoSave } from "../src/useFormAutoSave";

const fakeApiSave = async (formData: object) => {
  return new Promise<void>((resolve) => {
    console.log("Saving to API:", formData);
    setTimeout(() => {
      console.log("API Save Successful!");
      resolve();
    }, 2000);
  });
};

export const AutoSaveApiExample = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const { isSaving } = useFormAutoSave(formData, "user-api-form", 2000, "api", fakeApiSave);

  return (
    <div>
      <h2>Auto-Saving Form</h2>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <p>{isSaving ? "Saving..." : "Changes saved."}</p>
    </div>
  );
};
