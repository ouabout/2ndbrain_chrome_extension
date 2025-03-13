import axios from "axios";

type Bookmark = {
    url?: string;
    title?: string;
    raw_data: string;
    keywords?: string;
    tags?: string[];
    summary?: string;
    structured_summary?: string;
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
        console.log("summarizeContent: Error: ", error);
        throw new Error("summarizeContent: An error occurred while summarizing. Error: " + error);
    }
 
    //todo: 
    // 1. write /api/summarize endpoint
    // 2. handle summarization response and code for displaying it
};

export const startSummarizeContent = async (content: string, title: string, isYoutube = false) => {
    if (!content) {
        throw new Error("Content is required to summarize.");
    }

    try{
        if (isYoutube) {
            const requestBody = {content}
            const response = await axios.post("/api/bookmarks/utils/start-video-summary", requestBody, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.data;
            const retJobId = data.jobId;
            console.log("Job ID:", retJobId);
    
            return {jobId: retJobId};

        }
        else {
            const requestBody = {content, title};
            const response = await axios.post("/api/bookmarks/utils/start-website-summary", requestBody, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.data;
            const retTitle = data.title;
            const retJobId = data.jobId;
            console.log("Title:", retTitle);
            console.log("Job ID:", retJobId);
    
            return {title: retTitle, jobId: retJobId};
        }
    }
    catch (error) {
        console.log("startSummarizeContent: Error: ", error);
        throw new Error("startSummarizeContent: An error occurred while summarizing. Error: " + error);
    }

};

export const streamSummarizeContent = async (jobId: string, isYoutube = false) => {
    if (!jobId) {
        throw new Error("Job ID is required to summarize.");
        return;

    }
    try{
        let es_url : URL;
        if (isYoutube) {
            es_url = new URL('/api/bookmarks/utils/stream-video-summary', window.location.origin);
        }
        else {
            es_url = new URL('/api/bookmarks/utils/stream-website-summary', window.location.origin);
        }
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
        console.log("streamSummarizeContent: Error:", error);
        throw new Error("streamSummarizeContent: An error occurred while summarizing. Error: " + error);
    }
};

export const streamVideoSummary = async (jobId: string) => {
    if (!jobId) {
        throw new Error("Job ID is required to summarize.");
        return;

    }
    try{
        const es_url = new URL('/api/bookmarks/utils/stream-video-summary', window.location.origin);

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
        console.log("streamVideoSummary: Error:", error);
        throw new Error("streamVideoSummary: An error occurred while summarizing. Error: " + error);
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
        console.log("getTagsFromSummary: Error:", error);
        throw new Error("getTagsFromSummary:An error occurred while summarizing. Error: " + error);
    }
};

