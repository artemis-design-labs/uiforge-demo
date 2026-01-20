import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isOpen: false,
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
    },
    openChat: (state) => {
      state.isOpen = true;
    },
    closeChat: (state) => {
      state.isOpen = false;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action: PayloadAction<string>) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = action.payload;
      }
    },
    appendToLastMessage: (state, action: PayloadAction<string>) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content += action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
  },
});

export const {
  toggleChat,
  openChat,
  closeChat,
  addMessage,
  updateLastMessage,
  appendToLastMessage,
  setLoading,
  setError,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
