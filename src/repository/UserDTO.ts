export type User = { 
  email: string;
  name: string;
  senha: string;
  salt?: string | null;
}

export type ResponseUser = {
  id: number;
  email: string;
  name: string;
}