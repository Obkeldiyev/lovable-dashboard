import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { tokenStore } from "@/lib/api";

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string;
};

type State = { user: AuthUser | null; ready: boolean };

const initial: State = { user: null, ready: false };

const slice = createSlice({
  name: "auth",
  initialState: initial,
  reducers: {
    setUser(s, a: PayloadAction<AuthUser | null>) {
      s.user = a.payload;
      s.ready = true;
    },
    markReady(s) {
      s.ready = true;
    },
    logout(s) {
      tokenStore.clear();
      s.user = null;
    },
  },
});

export const { setUser, markReady, logout } = slice.actions;
export default slice.reducer;
