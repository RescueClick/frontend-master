import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import "./index.css";
import App from "./App.jsx";
import { store } from "./App/store.js";
import { Provider } from "react-redux";
import { SocketProvider } from "./components/SocketProvider";
import { AppLoaderProvider } from "./components/AppLoaderProvider";
import { antdThemeConfig } from "./config/antdTheme";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
