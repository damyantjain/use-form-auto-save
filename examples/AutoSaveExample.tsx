import React, { useState, useEffect } from "react";
import { useFormAutoSave } from "../src/useFormAutoSave";

export const AutoSaveExample = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const { restoreFormData } = useFormAutoSave(formData, "user-form");

  useEffect(() => {
    const savedData = restoreFormData();
    if (savedData) setFormData(savedData);
  }, []);

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
      <p>Data is savead after debounce time of 1 second</p>
    </div>
  );
};
