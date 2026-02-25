import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = `
    <div style="padding: 40px; background: #ef4444; color: white; font-family: monospace;">
      <h1>Error: React Root Not Found</h1>
      <p>The #root div is missing from the HTML.</p>
    </div>
  `;
} else {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("Critical error rendering app:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; background: #ef4444; color: white; font-family: monospace;">
        <h1>React Rendering Error</h1>
        <pre>${error}</pre>
      </div>
    `;
  }
}
