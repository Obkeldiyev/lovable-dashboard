import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import auth from "./authSlice";
import dashboard from "./dashboardSlice";
import preferences from "./preferencesSlice";

export const store = configureStore({
  reducer: { auth, dashboard, preferences },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
