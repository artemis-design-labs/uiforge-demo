import { configureStore } from "@reduxjs/toolkit";
import authSlice from './authSlice';
// import codeSlice from './codeSlice';
import figmaSlice from './figmaSlice';
import layoutSlice from './layoutSlice';
import chatSlice from './chatSlice';
import { persistenceMiddleware } from './persistence';

// Create store first without preloadedState to establish types
export const store = configureStore({
    reducer: {
        auth: authSlice,
        // code: codeSlice,
        figma: figmaSlice,
        layout: layoutSlice,
        chat: chatSlice,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(persistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
