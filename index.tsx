import React from "react";
import ReactDOM from "react-dom/client";
import { AutoSaveApiExample } from "./examples/AutoSaveApiExample";
import { ReactHookFormTest } from "./examples/ReactHookFormTest";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ReactHookFormTest />
  </React.StrictMode>
);