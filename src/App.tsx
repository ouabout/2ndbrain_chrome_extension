import { useEffect, useState, useRef } from "react";
import { Button } from "./components/ui/button";
import toast from "react-hot-toast";
import { USER_ID } from "@/common";
import { createNewBookmark, startSummarizeContent, getTagsFromSummary } from "./services/bookmark";  
import { Readability } from "@mozilla/readability";
import { YoutubeTranscript } from 'youtube-transcript';
import ReactMarkdown from 'react-markdown';

function MainApp({
  selection,
}: {
  selection: { content: string; contentText: string; src: string; title: string };
}) {
  const [savedInDB, setSavedInDB] = useState("");
  const [savedDocId, setSavedDocId] = useState("");
  const [showSelectedText, setShowSelectedText] = useState(false);
//  const [selectedContent] = useState(selection.content);
  const [summary, setSummary] = useState("");
  const [structuredSummary, setStructuredSummary] = useState("");  
  const [structuredSummaryOutput, setStructuredSummaryOutput] = useState("");
  const [tags, setTags] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [thinking, setThinking] = useState("");
  const [latestThinking, setLatestThinking] = useState("");
  const [showFullThinking, setShowFullThinking] = useState(false);
  //const [showFullSummary, setShowFullSummary] = useState(false);
  const thinkingRef = useRef<HTMLDivElement>(null); // Reference for the thinking div

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSaveTextIntoDB = async () => {
    try {
      setLoading(true);
      if (!selection.content) return toast.error("No text selected to save.");
      // convert tags to a string array
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];

      const { data } = await createNewBookmark(
        {
          url: selection.src,
          title: selection.title,
          raw_data: selection.content,          
          tags: tagsArray,
          keywords: keywords,
          summary: summary,
          structured_summary: structuredSummary,
          source: ""
        },
        USER_ID
      );

      setSavedInDB(data.message);
      setSavedDocId(data._id);
      console.log("saved doc id:" + data._id);
      toast.success("Content saved successfully!");
    } catch (error) {
      console.error(error, "Error");
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };


  const handleGetTags = async (sum) => {
    try { 
        // get tags from summary
        const result = await getTagsFromSummary(sum);
        const tags_str = result?.tags;
        const keywords_str = result?.keywords;
        console.log("Received tags: ", tags_str);

        // set tags
        setTags(tags_str);
        setKeywords(keywords_str);
        toast.success("Summary and tags generated successfully!");
    } catch (error) {
      console.error(error, "Error");
      toast.error("An error occurred while generating tags.");
    } 
  };

  const handleGetSummary = async () => {
    try {
      const isYoutube = selection.src.includes("youtube.com");
      setSummarizing(true);
      console.log("src: ", selection.src);
      
      let selectedHTML;
      if (isYoutube) {
        selectedHTML = selection.content;
      } else {
        selectedHTML = selection.contentText;      
      }

      console.log("isYoutube: ", isYoutube);
      console.log("selectedHTML: ", selectedHTML);
      if (!selectedHTML){
        return toast.error("No content to summarize.");
      }
      
      const resp = await startSummarizeContent(selectedHTML, selection.title, isYoutube);
      // data.summary is assumed to be a JSON string. Parse it if necessary.
      //const title = resp.title;
      const jobId = resp.jobId;
      console.log("started job id:", jobId);

      let es_url: URL;
      if (isYoutube) 
        es_url = new URL('/api/bookmarks/utils/stream-video-summary', backendUrl); // Use the environment variable here
      else
        es_url = new URL('/api/bookmarks/utils/stream-website-summary', backendUrl); // Use the environment variable here
      
      es_url.searchParams.append('jobId', jobId);       
      console.log("es_url:", es_url.toString());
      const eventSource = new EventSource(es_url.toString());        

      let respMsg = '';
      eventSource.onmessage = function(event) {      
        // Handle the received data
        //console.log(event.data);
        // replace all '\\n' inside event.data to '\n'
        const event_data = event.data.replace(/\\n/g, '\n');
        // append event.data to the response message
        respMsg += event_data;
        setThinking(respMsg);
        setSummary(respMsg);

        // update the thinking div with the last two lines
        const lines = respMsg.split('\n');
        const lastTwoLines = lines.slice(Math.max(lines.length - 2, 0));
        console.log("lastTwoLines: ", lastTwoLines);
        setLatestThinking(lastTwoLines.join('\n'));

        // Scroll to the bottom of the thinking div
        /*if (thinkingRef.current) {
          thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
        }*/
      };
      

      eventSource.addEventListener('stream-end', function(event) {
        console.log('GetSummary stream ended.');
        if(isYoutube){
          const retSummary = handleSummaryProcessing(respMsg);    //generate nice looking markdown video summary and a concise summary string
          setSummary(retSummary);
          handleGetTags(retSummary);
        }
        else{
          // get tags from summary
          handleGetTags(respMsg);
        }
        setSummarizing(false);
        // Handle stream end
        eventSource.close();
      });
    
      eventSource.onerror = function(error) {
        // Handle any errors that occur
        console.error('EventSource failed:', error);
        eventSource.close();
        setSummarizing(false);
        toast.error("Error: "+error);
     };        
    } catch (error) {
      setSummarizing(false);
      console.error(error, "Error");
      toast.error("An error occurred while generating summary.");
    }
  };

/*  const handleGetTextSummary = async () => {
    try {
      setSummarizing(true);
      
      const selectedHTML = selection.contentText;      

      console.log("selectedHTML: ", selectedHTML);
      if (!selectedHTML){
        return toast.error("No content to summarize.");
      }
      
      const resp = await startSummarizeContent(selectedHTML, selection.title, false);
      // data.summary is assumed to be a JSON string. Parse it if necessary.
      //const title = resp.title;
      const jobId = resp.jobId;
      console.log("started job id:", jobId);

      let es_url: URL;
      es_url = new URL('/api/bookmarks/utils/stream-website-summary', backendUrl); // Use the environment variable here
      
      es_url.searchParams.append('jobId', jobId);       
      console.log("es_url:", es_url.toString());
      const eventSource = new EventSource(es_url.toString());        

      let respMsg = '';
      eventSource.onmessage = function(event) {      
        // Handle the received data
        //console.log(event.data);
        // replace all '\\n' inside event.data to '\n'
        const event_data = event.data.replace(/\\n/g, '\n');
        // append event.data to the response message
        respMsg += event_data;
        setSummary(respMsg);
      };
      

      eventSource.addEventListener('stream-end', function(event) {
        console.log('GetTextSummary stream ended.');
        // get tags from summary
        handleGetTags(respMsg);        
        toast.success("Summary and tags generated successfully!");
        // Handle stream end
        eventSource.close();
        setSummarizing(false);

      });
    
      eventSource.onerror = function(error) {
        setSummarizing(false);

        // Handle any errors that occur
        console.error('EventSource failed:', error);
        eventSource.close();
        toast.error("Error: "+error);
     };        
    } catch (error) {
      setSummarizing(false);

      console.error(error, "Error");
      toast.error("An error occurred while generating text summary.");
    }
  };  */

  const handleSummaryProcessing = (content: string) => {
    try {
      console.log("processing thinking results to generate final summary...");
  
      // Extract JSON content using regex to handle markers and extra characters
      const jsonRegex = /```json([\s\S]*?)```/;
      const match = content.match(jsonRegex);
      let cleanedThinking;
      if (match) {
        cleanedThinking = match[1].trim();
      } else {
        cleanedThinking = content.trim();
      }
      setStructuredSummary(cleanedThinking);
  
      // Parse the cleaned JSON string
      const jsonData = JSON.parse(cleanedThinking);
  
      // Validate that jsonData is an object with a 'sections' array
      if (!jsonData || typeof jsonData !== "object" || !Array.isArray(jsonData.sections)) {
        throw new Error("Invalid JSON data format. Expected an object with 'sections' array.");
      }
  
      // Generate markdown summary
      let markdownSummary = `# Overall Summary\n${jsonData.summary || "No summary provided."}\n\n`;
      markdownSummary += "## Sections\n";
      jsonData.sections.forEach((section: any) => {
        markdownSummary += `### ${section.title || "Untitled"}\n`;
        markdownSummary += `**Timestamp:** ${section.timestamp || "N/A"}\n\n`;
        markdownSummary += `**Key Points:**\n`;
        if (Array.isArray(section.keypoints)) {
          section.keypoints.forEach((point: string) => {
            markdownSummary += `- ${point}\n`;
          });
        } else {
          markdownSummary += "- No key points provided.\n";
        }
        markdownSummary += "\n";
      });
  
      setStructuredSummaryOutput(markdownSummary);
      setSummary(jsonData.summary || "");

      return jsonData.summary || "";
    } catch (error: any) {
      console.error("Error processing summary:", error);
      setSummary(`Error processing summary: ${error.message}`);
    }
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center max-h-fit text-white p-4 w-full rounded-md">
        <div className="w-full p-6 bg-gray-900 rounded-md shadow-lg">
          <div className="mt-4">
            <button
              className="w-full py-2 px-4 bg-gray-800 rounded-md hover:bg-gray-700 transition duration-200"
              onClick={() => setShowSelectedText(!showSelectedText)}
            >
              {showSelectedText ? " Hide " : " Show "} context
            </button>
          </div>
          {showSelectedText && selection.content && (
            <div className="mt-4">
              <p className="mt-3 bg-gray-800 p-3 rounded-md text-gray-300">
                {selection.contentText ? selection.contentText : selection.content} 
              </p>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-4">
            <Button variant={"destructive"} onClick={handleGetSummary} disabled={summarizing || !selection.contentText}>
            {selection.contentText 
              ? (summarizing ? "Summarizing..." : "Summarize")
              : "Gathering context..."}
            </Button>
            {thinking && (
              <div className="mt-4" ref={thinkingRef}> {/* Added ref */}
                <div
                  className="mt-3 bg-gray-800 p-3 rounded-md text-gray-300 cursor-pointer"
                  onClick={() => setShowFullThinking(!showFullThinking)}
                >
                  {/* Conditionally render full or truncated thinking */}
                  {showFullThinking ? (
                    <p>{thinking}</p>
                  ) : (
                    <p>{latestThinking}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-4">
          <div className="mt-4">
              {structuredSummaryOutput || summary ? ( // Conditional rendering
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-4xl font-bold my-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-3xl font-bold my-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-2xl font-bold my-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-base leading-relaxed my-2" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 my-2" {...props} />,
                    li: ({node, ...props}) => <li className="my-1" {...props} />,
                  }}
                >
                  {structuredSummaryOutput || summary} 
                </ReactMarkdown>
              ) : null}
          </div>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <Button variant={"destructive"} onClick={() => handleGetTags(summary)}>
              Generate Tags
            </Button>
            {tags && (
              <div className="mt-4">
                <p className="mt-3 bg-gray-800 p-3 rounded-md text-gray-300"
                dangerouslySetInnerHTML={{__html: tags}}
                />
              </div>                
            )}            
            <Button
              variant={"destructive"}
              onClick={handleSaveTextIntoDB}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
            {savedInDB && (
              <p className="text-center text-green-500">
                Saved successfully! {savedInDB}
              </p>
            )}
            {savedDocId && (
              <p className="text-center text-green-500">
                <a href={`${backendUrl}/bookmarks/edit?id=${savedDocId}`} target="_blank" rel="noopener noreferrer">Open saved bookmark</a> 
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const App = () => {
  const [selection, setSelection] = useState({
    content: "",
    contentText: "",
    src: "",
    title: "",
  });

  useEffect(() => {
    console.log("App.tsx: useEffect (storage listener) triggered"); // Debug: Listener setup    

    // @ts-ignore
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "selectionChanged") {
        console.log("App.tsx: selectionChanged message received");
        const payload = message.payload ?? {};
        console.log("App.tsx received payload: ", payload);
        updateContentOnUI(payload);
      }
    });

    // @ts-ignore
    // Signal that the popup is ready to receive messages
    chrome.runtime.sendMessage({ type: "PopupReady" })
    .then(response => {
      console.log("App.tsx: Background script acknowledged popup ready:", response);
    })
    .catch(error => {
      console.log("App.tsx: Failed to notify background script:", error);
    });      
    return () => {};
  }, []);

  async function updateContentOnUI({
    content,
    title,
    source,
  }: {
    content: string;
    title: string;
    source: string;
  }) {
    if (typeof content !== "string") return;

    console.log("App.tsx: updateContentOnUI content: ", content);
    console.log("App.tsx: updateContentOnUI source: ", source);
    console.log("App.tsx: updateContentOnUI title: ", title);

    let contentText = "";
    // check if selection.src is a youtube url
    if (source && source.includes("youtube.com")) {
      const transcript = await YoutubeTranscript.fetchTranscript(source);
      console.log("transcript: ", transcript);
      // convert transcript json array into a string
      content = JSON.stringify(transcript, null , 2);
      // convert transcript text into a string
      contentText = transcript.map(item => item.text).join("\n");
    }
    else {
      const hasHTMLTag = /<html[\s\S]*>/.test(content);
      let html: string;

      if (hasHTMLTag) {
        console.log("hasHTMLTag");
        html = content;
      } else {
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Fragment Document</title>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `;
        console.log("noHTMLTag");
        console.log("html: ", html);
      }

      const contentDoccument = new DOMParser().parseFromString(html, "text/html");

      const parsed = new Readability(contentDoccument, {}).parse();
      if (!parsed?.content) 
        return;
      else
        content = parsed?.content;
      contentText = content.replace(/<[^>]*>?/gm, '').replace(/<script[^>]*>.*?<\/script>/gm, '') || '';      
      console.log("content text: ", contentText);
    }

    setSelection({
      content: content,
      contentText: contentText,
      src: source,
      title: title,
    });
  }

  return (
    <main className="flex flex-col bg-gray-900 text-white min-w-[436px] w-full">
      <h1 className="text-2xl font-bold text-center mb-6 capitalize p-2">
        2nd Brain
      </h1>
      <MainApp selection={selection} />
    </main>
  );
};

export default App;
