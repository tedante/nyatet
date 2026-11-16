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
  expiresAt: string | null;
  createdAt: string;
};
