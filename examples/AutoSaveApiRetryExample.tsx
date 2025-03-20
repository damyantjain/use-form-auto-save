import React, { useState } from "react";
import { useFormAutoSave } from "../src/useFormAutoSave";

export const AutoSaveApiRetryTest = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const fakeApiSave = async (data: object) => {
    console.log("API SAVE ATTEMPT with data:", data);
    return Promise.reject("Simulated API failure");
  };

  const { isAutoSavePaused, resumeAutoSave } = useFormAutoSave({
    formData,
    formKey: "api-retry-test",
    debounceTime: 1000,
    storageType: "api",
    saveFunction: fakeApiSave,
    maxRetries: 3,
    onError: (err) => console.error("onError callback:", err),
  });

  return (
    <div>
      <h2>Manual Test - API Retry & Exponential Backoff</h2>
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
      {isAutoSavePaused && (
        <div>
          <p>Auto-save paused after max retries.</p>
          <button onClick={resumeAutoSave}>Retry Auto-Save</button>
        </div>
      )}
    </div>
  );
};
