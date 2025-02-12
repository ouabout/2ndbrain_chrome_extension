import axios from "axios";

export const fetchUserNotebooks = async (userId: string) => {
  return await axios.get(`/api/ai/notebook`, {
    headers: {
      userId
    }
  });
};


export const createNotebook = async ({
  title,
  description,
}: {
  title: string;
  description?: string;

}, userId: string) => {
  return await axios.post(
    "/api/ai/notebook",

    {
      title,
      description,
      tags: [],
    },
    {
      headers: {
        userId
      }
    }
  );
};