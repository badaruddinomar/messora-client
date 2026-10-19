import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authReducer } from "@/features/auth/auth-slice";
import { api } from "./api";
import { errorToastMiddleware } from "./error-toast-middleware";

const rootReducer = combineReducers({
  auth: authReducer,
  [api.reducerPath]: api.reducer,
});

/** A new store per request on the server, one store per tab in the browser. */
export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(api.middleware, errorToastMiddleware),
  });
  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
