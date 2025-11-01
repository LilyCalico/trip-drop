import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import Button from "@/components/custom/button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ButtonDeleteProps {
  id: string;
  description: string;
  handleConfirm: (id: string) => void;
}

export default function ButtonDelete({
  id,
  description,
  handleConfirm,
}: ButtonDeleteProps) {
  const [open, setOpen] = useState(false);

  const handleCancel = () => {
    setOpen(false);
  };

  const handleDelete = () => {
    handleConfirm(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="cursor-pointer"
        >
          <FaTrash className="w-[1.2rem] h-[1.2rem] text-black/60 hover:text-red-300 transition-colors duration-150" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[30rem] bg-white border-none pt-[3.2rem] pb-[2.4rem] text-center">
        <DialogHeader>
          <DialogTitle className="text-[1.2rem]">
            Are you sure you want to delete this?
          </DialogTitle>
          <DialogDescription className="text-[1rem]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-[1rem] justify-center mt-[1.6rem]">
          <Button
            type="button"
            className="bg-white text-black"
            onClick={(event) => {
              event.stopPropagation();
              handleCancel();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-400 text-white"
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
