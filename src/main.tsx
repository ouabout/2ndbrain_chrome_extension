import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Toaster } from "react-hot-toast";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster position="top-left" />
    <App />
  </StrictMode>
);
