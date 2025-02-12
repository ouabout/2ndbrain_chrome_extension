import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import toast from "react-hot-toast";
import { USER_ID } from "@/common";
import Notebook from "./components/NotebookSelect";
import Login from "./components/Login";
import { createNewNote } from "./services/note";

function MainApp({
  setIsLoggedIn,
  selection,
}: {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  selection: { content: string; src: string; title: string };
}) {
  const [notebookId, setNotebookId] = useState("");
  const [savedInDB, setSavedInDB] = useState("");
  const [showSelectedText, setShowSelectedText] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveTextIntoDB = async () => {
    try {
      setLoading(true);
      if (!notebookId) return toast.error("Please select a notebook first.");
      if (!selection.content) return toast.error("No text selected to save.");

      const { data } = await createNewNote(
        {
          notebookId: notebookId,
          query: selection.title,
          title: selection.title,
          answer: selection.content,
          sources: [
            {
              url: selection.src,
              title: selection.title,
              content: selection.title,
            },
          ],
        },
        USER_ID
      );

      setSavedInDB(data.message);
      toast.success("Content saved successfully!");
    } catch (error) {
      console.error(error, "Error");
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    toast.success("Logged out successfully!");
    window.location.reload();
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center max-h-fit text-white p-4 w-full rounded-md">
        <div className="w-full p-6 bg-gray-900 rounded-md shadow-lg">
          {USER_ID && (
            <Notebook onChange={(value: string) => setNotebookId(value)} />
          )}
          <div className="mt-4">
            <button
              className="w-full py-2 px-4 bg-gray-800 rounded-md hover:bg-gray-700 transition duration-200"
              onClick={() => setShowSelectedText(!showSelectedText)}
            >
              {showSelectedText ? " Hide " : " Show "} selected content
            </button>
          </div>
          {showSelectedText && selection.content && (
            <div className="mt-4">
              <p className="mt-3 bg-gray-800 p-3 rounded-md text-gray-300">
                {selection.content}
              </p>
            </div>
          )}
          {USER_ID && (
            <div className="mt-6 flex flex-col gap-4">
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
              <Button variant={"destructive"} onClick={handleLogout}>
                Log out
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selection, setSelection] = useState({
    content: "",
    src: "",
    title: "",
  });
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    let intervalId;
    intervalId = setInterval(async () => {
      // @ts-ignore
      if (!chrome?.storage?.local) return;
      // @ts-ignore
      const { lastSelectedText } = await chrome.storage.local.get(
        "lastSelectedText"
      );

      // @ts-ignore
      const { lastSelectedTextSrc } = await chrome.storage.local.get(
        "lastSelectedTextSrc"
      );

      // @ts-ignore
      const { pageTitle } = await chrome.storage.local.get("pageTitle");

      console.log(
        "Selected text from storage",
        lastSelectedText,
        "src",
        lastSelectedTextSrc,
        "pageTitle",
        pageTitle
      );
      if (typeof lastSelectedText !== "string") return;

      setSelection({
        content: lastSelectedText,
        src: lastSelectedTextSrc,
        title: pageTitle,
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };

    // const handleMessage = (message: any) => {
    //   console.log("React App: Received Message:", message);
    //   if (message.type === "selectionChanged") {
    //     setSelectedText(message.payload.selectedText);
    //   }
    // };
    // // @ts-ignore
    // chrome.runtime.onMessage.addListener(handleMessage);
    // return () => {
    //   // @ts-ignore
    //   chrome.runtime.onMessage.removeListener(handleMessage);
    // };
    // @ts-ignore
  }, []);

  return (
    <main className="flex flex-col bg-gray-900 text-white min-w-[436px] w-full">
      {!isLoggedIn && (
        <>
          <h1 className="text-2xl font-bold text-center mb-6 capitalize p-2">
            AI Labs
          </h1>
          <form
            className="p-10 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              window.open(
                `${import.meta.env.VITE_BACKEND_URL}?q=${encodeURIComponent(
                  searchInput
                )}`,
                "_blank"
              );
            }}
          >
            <input
              id="ai-search"
              type="text"
              placeholder="AI Search..."
              className="p-2 rounded-md bg-gray-700 text-white flex-1"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant={"outline"}>
              Search
            </Button>
          </form>
        </>
      )}
      {!isLoggedIn && !USER_ID && (
        <div className="px-10">
          <Button
            variant={"outline"}
            className="w-full"
            onClick={() => setIsLoggedIn(true)}
          >
            Login
          </Button>
        </div>
      )}
      {isLoggedIn ? (
        <Login setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <MainApp setIsLoggedIn={setIsLoggedIn} selection={selection} />
      )}
    </main>
  );
};

export default App;
