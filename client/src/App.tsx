/*
 * App is the top of the component tree. It sets up the two "providers" that the
 * whole application depends on, wrapped around the routes:
 *
 *   1. Provider (react-redux)  - makes the Redux store available everywhere, so
 *                                any component can read state and dispatch.
 *   2. BrowserRouter (router)  - enables navigation between pages by URL.
 *
 * Inside both of these sits <AppRoutes />, which decides which page to show.
 * (Ant Design works with its default theme, so no ConfigProvider is needed.)
 */

import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./app/store";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    // Provider (react-redux) makes the Redux store available to every component.
    // BrowserRouter (react-router) enables navigation between pages by URL.
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
