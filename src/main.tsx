import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/shantell-sans/400.css";
import "@fontsource/shantell-sans/500.css";
import "@fontsource/shantell-sans/600.css";
import "@fontsource/shantell-sans/700.css";
import "@fontsource/shantell-sans/800.css";
import "@fontsource/dynapuff/500.css";
import "@fontsource/dynapuff/600.css";
import "@fontsource/dynapuff/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/shell.css";
import "./styles/screens.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
