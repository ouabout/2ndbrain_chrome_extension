import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { createNotebook, fetchUserNotebooks } from "../services/notebook";
import { USER_ID } from "@/common";
import SingleSelect from "./SingleSelect";
import toast from "react-hot-toast";
import { Button } from "./ui/button";

const Notebook = ({ onChange }: { onChange: (value: string) => void }) => {
  const [notebook, setNotebooks] = useState([]);
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);

  useEffect(() => {
    fetchNotebooks();
  }, [USER_ID]);

  async function fetchNotebooks() {
    try {
      const { data } = await fetchUserNotebooks(USER_ID);
      setNotebooks(data.notebooks);
    } catch (error) {
      console.log(error, "error");
      toast.error("Failed to fetch notebooks");
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {isCreatingNotebook ? (
        <CreateBook
          setIsCreatingNotebook={setIsCreatingNotebook}
          refetchNotebooks={fetchNotebooks}
        />
      ) : (
        <>
          <Button
            variant={"outline"}
            onClick={() => {
              setIsCreatingNotebook(true);
            }}
          >
            Create new notebook
          </Button>
          <SingleSelect
            onChange={onChange}
            title="Notebook Select"
            data={notebook}
          />
        </>
      )}
    </div>
  );
};

export default Notebook;

const CreateBook = ({
  setIsCreatingNotebook,
  refetchNotebooks,
}: {
  setIsCreatingNotebook: Dispatch<SetStateAction<boolean>>;
  refetchNotebooks: () => Promise<void>;
}) => {
  const [notebookBeingCreated, setNotebookBeingCreated] = useState({
    title: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          setIsLoading(true);
          await createNotebook(notebookBeingCreated, USER_ID);

          toast.success("Notebook created successfully");
          refetchNotebooks();
        } catch (error) {
          console.log(error, "Error at notebook creation");
        } finally {
          setIsLoading(false);
          setIsCreatingNotebook(false);
        }
      }}
      className="flex flex-col space-y-4 my-2 border p-2 rounded-sm"
    >
      <h3 className="text-center font-bold">Creating new notebook</h3>
      <label className="text-md capitalize">title</label>
      <input
        type="text"
        className="border text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-indigo-200"
        placeholder="Enter title"
        value={notebookBeingCreated.title}
        onChange={(e) => {
          setNotebookBeingCreated((prev) => ({
            ...prev,
            title: e.target.value,
          }));
        }}
      />
      <label className="text-md capitalize"> description</label>
      <textarea
        className="border text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-indigo-200"
        placeholder="Enter description"
        value={notebookBeingCreated.description}
        onChange={(e) => {
          setNotebookBeingCreated((prev) => ({
            ...prev,
            description: e.target.value,
          }));
        }}
      />
      <div className="flex space-x-4 justify-end">
        <Button
          disabled={isLoading}
          variant={"outline"}
          type="button"
          onClick={() => setIsCreatingNotebook(false)}
        >
          Cancel
        </Button>
        <Button disabled={isLoading} variant={"outline"} type="submit">
          {isLoading ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
};
