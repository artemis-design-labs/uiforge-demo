import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LayoutState {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  isMobile: boolean;
}

const initialState: LayoutState = {
  leftSidebarWidth: 320,
  rightSidebarWidth: 320,
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: true,
  isMobile: false,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleLeftSidebar: (state) => {
      state.leftSidebarCollapsed = !state.leftSidebarCollapsed;
    },
    toggleRightSidebar: (state) => {
      state.rightSidebarCollapsed = !state.rightSidebarCollapsed;
    },
    setLeftSidebarWidth: (state, action: PayloadAction<number>) => {
      state.leftSidebarWidth = Math.max(200, Math.min(500, action.payload));
    },
    setRightSidebarWidth: (state, action: PayloadAction<number>) => {
      state.rightSidebarWidth = Math.max(250, Math.min(600, action.payload));
    },
    setMobileMode: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
      // Auto-collapse sidebars on mobile
      if (action.payload) {
        state.leftSidebarCollapsed = true;
        state.rightSidebarCollapsed = true;
      }
    },
    setLeftSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.leftSidebarCollapsed = action.payload;
    },
    setRightSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.rightSidebarCollapsed = action.payload;
    },
  },
});

export const {
  toggleLeftSidebar,
  toggleRightSidebar,
  setLeftSidebarWidth,
  setRightSidebarWidth,
  setMobileMode,
  setLeftSidebarCollapsed,
  setRightSidebarCollapsed,
} = layoutSlice.actions;

export default layoutSlice.reducer;