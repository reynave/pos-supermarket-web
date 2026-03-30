export interface User {
  id: string;
  name: string;
  role: string;
  userAccessId: number;
  saveFunc: string | null;
  saveShortCut: string | null;
}

export interface LoginRequest {
  userId: string;
  password?: string;
  terminalId?: string;
}

export interface LoginResponse {
  token: string;
  sessionId: string;
  user: User;
  terminalId: string;
}
