import React, { useState } from "react";
import { useFormAutoSave } from "../src/useFormAutoSave";

const fakeApiSaveWithError = async (formData: object) => {
  return new Promise<void>((resolve, reject) => {
    console.log("Saving to API:", formData);
    setTimeout(() => {
      if (Math.random() < 0.3) {
        console.error("API Save Failed!");
        reject(new Error("API save failed"));
      } else {
        console.log("API Save Successful!");
        resolve();
      }
    }, 1000);
  });
};

const handleError = (error: any) => {
  alert("Error saving form: " + error.message);
};

export const AutoSaveApiExample = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });

  useFormAutoSave(formData, "user-api-form", 2000, "api", fakeApiSaveWithError, handleError);

  return (
    <div>
      <h2>Auto-Saving Form (API Mode)</h2>
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
      <p>Data is automatically saved to the API every 2 seconds.</p>
    </div>
  );
};
