import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.jsx";
import { store } from "./App/store.js";
import { Provider } from "react-redux";
import { SocketProvider } from "./components/SocketProvider";
import { AppLoaderProvider } from "./components/AppLoaderProvider";
import { antdThemeConfig } from "./config/antdTheme";
import { getGoogleWebClientId } from "./utils/googleAuth";

// Disable wheel/scroll changes on number inputs globally to prevent accidental edits
document.addEventListener("wheel", function (e) {
  if (document.activeElement && document.activeElement.type === "number") {
    document.activeElement.blur();
  }
});

const googleClientId = getGoogleWebClientId();

const appTree = (
  <ConfigProvider theme={antdThemeConfig}>
    <Provider store={store}>
      <BrowserRouter>
        <SocketProvider>
          <AppLoaderProvider>
            <App />
          </AppLoaderProvider>
        </SocketProvider>
      </BrowserRouter>
    </Provider>
  </ConfigProvider>
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
    ) : (
      appTree
    )}
  </React.StrictMode>
);
