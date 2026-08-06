import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import PwaInstallButton from "./components/PwaInstallButton";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
    <PwaInstallButton />
  </HelmetProvider>
);
