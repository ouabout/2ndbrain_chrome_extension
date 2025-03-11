import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import toast from "react-hot-toast";
import { USER_ID } from "@/common";
import { createNewBookmark, startSummarizeContent, getTagsFromSummary } from "./services/bookmark";  
import { Readability } from "@mozilla/readability";
import { YoutubeTranscript } from 'youtube-transcript';

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
  const [tags, setTags] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
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

/*  const handleProcess = async () => {
    try {
      // check if selection.src is a youtube url
      if (selection.src.includes("youtube.com")) {
        const transcript = await YoutubeTranscript.fetchTranscript(selection.src);
        console.log("transcript: ", transcript);
        // convert transcript json array into a string
        const transcriptString = JSON.stringify(transcript, null , 2);
        // convert transcript text into a string
        const transcriptText = transcript.map(item => item.text).join("\n");
        setSelectedContent(transcriptString);
        setSelectionContentText(transcriptText);
        return;
      }

      let selectedHTML = selection.content;
      if (!selectedHTML){
        console.log("No HTML found in selection");
        return;
      }

      // Check if the content already seems like a full HTML document.
      const hasHTMLTag = /<html[\s\S]*>/i.test(selectedHTML);
      let fullHTML;

      if (hasHTMLTag) {
        fullHTML = selectedHTML;
      } else {
        // If it's just a fragment, wrap it in a basic HTML structure.
        fullHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Fragment Document</title>
            </head>
            <body>
              ${selectedHTML}
            </body>
          </html>
        `;
      }

      // Create a DOM document from the HTML string.
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHTML, "text/html");

      // Use Readability to parse the document.
      const article = new Readability(doc).parse();
      // remove all html tags and script tags and keep only the text
      const articleText = article?.content.replace(/<[^>]*>?/gm, '').replace(/<script[^>]*>.*?<\/script>/gm, '') || '';

      if (article) {
        console.log("Article Title:", article.title);
        console.log("Article Content Text:", articleText);
        setSelectedContent(article.content);
        setSelectionContentText(articleText);
      } else {
        console.log("Readability could not parse the content.");
      }
    } catch (error) {
      console.error("Error processing article:", error);  
    }
  };
*/
  /*
  const handleSummarize = async () => {
    //TODO: streaming summarization output
    //TODO: fill in keywords during summarization
    try {
      setSummarizing(true);
      
      let selectedHTML = selectedContent;
      if (!selectedHTML){
        return toast.error("No content to summarize.");
      }
      
      const { data } = await summarizeContent(selectedHTML);
      // data.summary is assumed to be a JSON string. Parse it if necessary.
      let summaryData: any;
      if (typeof data.summary === "string") {
        try {
          summaryData = JSON.parse(data.summary);
        } catch (parseError) {
          console.error("Error parsing summary JSON:", parseError);
          toast.error("Error processing summary data.");
          return;
        }
      } else {
        toast.error("Error processing summary data.");
        return;
      }

      // Extract keyInsights from the parsed summary data
      if (!summaryData.keyInsights || !Array.isArray(summaryData.keyInsights)) {
        toast.error("Summary does not contain key insights.");
        return;
      }
      const keypoints = summaryData.keyInsights;
      console.log("keypoints:", keypoints);
      if (Array.isArray(keypoints)) {
        // convert keypoints to a string
        const keypointsString = keypoints.map(keypoint => `• ${keypoint}`).join("<br>");
        setSummary(keypointsString);
      } else {
        setSummary(keypoints);
      }
      toast.success("Summary generated successfully!");
    } catch (error) {
      console.error(error, "Error");
      toast.error("An error occurred while generating summary.");
    } finally {
      setSummarizing(false);
    }
  };
  */

  const handleGetTags = async () => {
    try { 
        // get tags from summary
        const result = await getTagsFromSummary(summary);
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
      setSummarizing(true);
      
      let selectedHTML = selection.contentText;
      console.log("selectedHTML: ", selectedHTML);
      if (!selectedHTML){
        return toast.error("No content to summarize.");
      }
      
      const resp = await startSummarizeContent(selectedHTML, selection.title);
      // data.summary is assumed to be a JSON string. Parse it if necessary.
      //const title = resp.title;
      const jobId = resp.jobId;
      console.log("started job id:", jobId);

      const es_url = new URL('/api/bookmarks/utils/stream-website-summary', backendUrl); // Use the environment variable here
      es_url.searchParams.append('jobId', jobId);       
      console.log("es_url:", es_url.toString());
      const eventSource = new EventSource(es_url.toString());        

      let respMsg = '';
      eventSource.onmessage = function(event) {      
        // Handle the received data
        console.log(event.data);
          // append event.data to the response message
          respMsg += event.data; 
          setSummary(respMsg);
      };

      eventSource.addEventListener('stream-end', function(event) {
        console.log('Stream ended:');
        // get tags from summary
        /*const respTags = getTagsFromSummary(respMsg);
        console.log("Received tags: ", respTags);
        // set tags
        setTags(respTags['tags']);
        toast.success("Summary and tags generated successfully!");*/
        // Handle stream end
        eventSource.close();
      });
    
      eventSource.onerror = function(error) {
        // Handle any errors that occur
        console.error('EventSource failed:', error);
        eventSource.close();
        toast.error("Error: "+error);
     };        
    } catch (error) {
      console.error(error, "Error");
      toast.error("An error occurred while generating summary.");
    } finally {
      setSummarizing(false);
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
            <Button variant={"destructive"} onClick={handleGetSummary} disabled={summarizing}>
              {summarizing ? "Summarizing..." : "Summarize"}
            </Button>
            {summary && (
              <div className="mt-4">
                <p className="mt-3 bg-gray-800 p-3 rounded-md text-gray-300"
                dangerouslySetInnerHTML={{__html: summary}}
                />
              </div>                
            )}
            <Button variant={"destructive"} onClick={handleGetTags}>
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
