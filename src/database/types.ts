export type TuserDB = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type TtaskDb = {
  id: string;
  type: string;
  description: string;
  created_at: string;
  status: number;
};
