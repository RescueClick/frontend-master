import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { store } from "./App/store.js";
import { Provider } from "react-redux";
import { SocketProvider } from "./components/SocketProvider";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
     <Provider store={store}> 
      <BrowserRouter>
        <SocketProvider>
          <App />
        </SocketProvider>
      </BrowserRouter>
    </Provider> 
  </React.StrictMode>
);
