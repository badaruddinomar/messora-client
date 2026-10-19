import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/lib/types";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
}

const initialState: AuthState = { user: null, status: "unknown" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userSet(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    loggedOut(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
  selectors: {
    selectUser: (state) => state.user,
    selectAuthStatus: (state) => state.status,
  },
});

export const { userSet, loggedOut } = authSlice.actions;
export const { selectUser, selectAuthStatus } = authSlice.selectors;
export const authReducer = authSlice.reducer;
