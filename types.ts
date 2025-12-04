export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview'
}

export type Theme = 'default' | 'neo' | 'zen' | 'paper';
export type LayoutMode = 'classic' | 'wanderlust' | 'neo' | 'zen' | 'paper';