export type Note = {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type Share = {
  id: string;
  token: string;
  name: string | null;
  expiresAt: string | null;
  expired: boolean;
  createdAt: string;
};
