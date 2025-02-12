import axios from "axios";

type Note = {
    query: string;
    title: string;
    answer: string | null;
    followUpQuestions?: string[];
    sources: { url: string, score?: number, title: string, content: string, raw_content?: string | null }[];
    notebookId: string
}

export const createNewNote = (note: Note, userId: string) => {
    return axios.post("/api/ai/notes", note, {
        headers: {
            userId
        }
    });
}