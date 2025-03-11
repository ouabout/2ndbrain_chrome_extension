import axios from "axios";

type Bookmark = {
    url?: string;
    title?: string;
    raw_data: string;
    keywords?: string;
    tags?: string[];
    summary?: string;
    source?: string;
}

export const createNewBookmark = async (bookmark: Bookmark, userId: string) => {
    if (!bookmark.raw_data) {
        throw new Error("Data is required to create a bookmark.");
    }

    return axios.post("/api/bookmarks/save-ext", { bookmark}, {
        headers: {
            userId
        }
    });
};

export const summarizeContent = async (content: string) => {
    if (!content) {
        throw new Error("Content is required to summarize.");
    }

    const requestBody = {content};

    try{
        return await axios.post("/api/notes/generate-summary2", requestBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
    catch (error) {
        console.log(error);
        throw new Error("An error occurred while summarizing.");
    }
 
    //todo: 
    // 1. write /api/summarize endpoint
    // 2. handle summarization response and code for displaying it
};

export const startSummarizeContent = async (content: string, title: string) => {
    if (!content) {
        throw new Error("Content is required to summarize.");
    }

    const requestBody = {content, title};

    try{
        const response = await axios.post("/api/bookmarks/utils/start-website-summary", requestBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.data;
        const title = data.title;
        const jobId = data.jobId;
        console.log("Title:", title);
        console.log("Job ID:", jobId);  

        return {title, jobId};
    }
    catch (error) {
        console.log(error);
        throw new Error("An error occurred while summarizing.");
    }

};

export const streamSummarizeContent = async (jobId: string) => {
    if (!jobId) {
        throw new Error("Job ID is required to summarize.");
        return;

    }
    try{
        const es_url = new URL('/api/bookmarks/utils/stream-website-summary', window.location.origin);

        es_url.searchParams.append('jobId', jobId);        
        
        const eventSource = new EventSource(es_url.toString());        

        let respMsg = '';
        eventSource.onmessage = function(event) {      
          // Handle the received data
          // console.log(event.data);
            // append event.data to the response message
            respMsg += event.data; 
            return respMsg;
        };
      
        eventSource.onerror = function(error) {
          // Handle any errors that occur
          console.error('EventSource failed:', error);
          eventSource.close();

          return error;
        };        
    }
    catch (error) {
        console.log(error);
        throw new Error("An error occurred while summarizing.");
    }
};

export const getTagsFromSummary = async (summary: string) => {
    if (!summary) {
        throw new Error("summary is required for generating tags.");
        return;

    }
    try{
        const requestBody = {summary};
        console.log("request body:", requestBody);

        const response = await axios.post("/api/bookmarks/utils/get-tags-from-summary", requestBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.data;
        const tags = data.tags;
        const keywords = data.keywords;

        return {tags, keywords};    
    }
    catch (error) {
        console.log(error);
        throw new Error("An error occurred while summarizing.");
    }
};

