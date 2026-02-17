import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ==== DIAGNOSTIC LOGGING ====
console.log("%c🚀 SmartRide.AI Starting...", "color: #14b8a6; font-size: 16px; font-weight: bold");
console.log("1️⃣ main.tsx loaded successfully");
console.log("2️⃣ Checking for #root element...");

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ CRITICAL: Root element (#root) not found!");
  document.body.innerHTML = `
    <div style="padding: 40px; background: #ef4444; color: white; font-family: monospace;">
      <h1>❌ Error: React Root Not Found</h1>
      <p>The #root div is missing from the HTML.</p>
    </div>
  `;
} else {
  console.log("✅ Root element found:", rootElement);
  console.log("3️⃣ Creating React root...");
  
  try {
    const root = createRoot(rootElement);
    console.log("✅ React root created");
    console.log("4️⃣ Rendering App component...");
    
    root.render(<App />);
    
    console.log("%c✅ APP RENDERED SUCCESSFULLY!", "color: #10b981; font-size: 14px; font-weight: bold");
    console.log("If you see this message but screen is white, check App component render.");
  } catch (error) {
    console.error("❌ CRITICAL ERROR rendering app:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; background: #ef4444; color: white; font-family: monospace;">
        <h1>❌ React Rendering Error</h1>
        <pre>${error}</pre>
      </div>
    `;
  }
}
