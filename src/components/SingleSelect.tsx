import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Notebook } from "@/types";

export default function SingleSelect({
  title,
  data,
  onChange,
}: {
  title: string;
  data: Notebook[];
  onChange(value: string): void;
}) {
  return (
    <Select
      onValueChange={(value) => {
        onChange(value);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a Notebook" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{title}</SelectLabel>
          {data &&
            data?.map((notebook) => {
              return (
                <SelectItem key={notebook.id} value={notebook.id}>
                  {notebook.title}
                </SelectItem>
              );
            })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
