import React from "react";
import ReactDOM from "react-dom/client";
import { AutoSaveApiExample } from "./examples/AutoSaveApiExample";
import { AutoSaveExample } from "./examples/AutoSaveExample";
import { AutoSaveReactHook } from "./examples/AutoSaveReactHook";
import { AutoSaveApiRetryTest } from "./examples/AutoSaveApiRetryExample";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AutoSaveApiExample />
  </React.StrictMode>
);