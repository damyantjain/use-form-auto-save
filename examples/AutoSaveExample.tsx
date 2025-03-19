import React, { useState, useEffect } from "react";
import { useFormAutoSave } from "../src/useFormAutoSave";

export const AutoSaveExample = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const { restoreFormData } = useFormAutoSave({
    formData,
    formKey: "user-form",
    debounceTime: 1000,
    storageType: "sessionStorage",
  });
  useEffect(() => {
    const savedData = restoreFormData();
    if (savedData) setFormData(savedData);
  }, []);

  return (
    <div>
      <h2>Auto-Saving Form (Session Storage)</h2>
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
      <p>Data is automatically saved every second to <b>sessionStorage</b>.</p>
    </div>
  );
};