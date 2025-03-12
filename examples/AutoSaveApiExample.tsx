import React, { useState } from "react";
import { useFormAutoSave } from "../src/useFormAutoSave";

const fakeApiSave = async (formData: object) => {
  return new Promise<void>((resolve, reject) => {
    console.log("Saving to API:", formData);
    setTimeout(() => {
      if (Math.random() > 0.1) {
        console.log("API Save Successful!");
        resolve();
      } else {
        console.warn("API Save Failed!");
        reject(new Error("API Save Failed"));
      }
    }, 1000);
  });
};


export const AutoSaveApiExample = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const { isSaving, isSaveSuccessful, isAutoSavePaused, resumeAutoSave } = useFormAutoSave(formData, "user-api-form", 2000, "api", fakeApiSave);

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
      <p>
        {isSaving 
          ? "Saving..." 
          : isAutoSavePaused 
            ? "Auto-save failed 3 times. Click to retry."
            : isSaveSuccessful
              ? "All changes saved!"
              : "Auto-save failed."
        }
      </p>

      {isAutoSavePaused && (
      <div>
        <p>Auto-save paused due to repeated failures.</p>
        <button onClick={resumeAutoSave}>Retry Auto-Save</button>
      </div>
    )}

    </div>
  );
};
