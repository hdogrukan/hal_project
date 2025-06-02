// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";   // ⭐️ ekle
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();                                       // ⭐️ ekle

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>                             {/* ⭐️ sarmala */}
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
