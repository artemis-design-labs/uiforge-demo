import { configureStore } from "@reduxjs/toolkit";
import authSlice from './authSlice';
// import codeSlice from './codeSlice';
import figmaSlice from './figmaSlice';
import layoutSlice from './layoutSlice';
import { persistenceMiddleware, loadPersistedState } from './persistence';

// Load persisted state
const preloadedState = loadPersistedState();

export const store = configureStore({
    reducer: {
        auth: authSlice,
        // code: codeSlice,
        figma: figmaSlice,
        layout: layoutSlice,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(persistenceMiddleware),
    preloadedState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
