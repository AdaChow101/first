export interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}

export enum ViewState {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  AI_TUTOR = 'AI_TUTOR'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}