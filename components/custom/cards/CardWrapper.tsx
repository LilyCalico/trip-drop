import { cn } from "@/lib/utils";

export default function CardWrapper({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "relative w-[34.5rem] flex gap-[2.4rem] items-start text-[1rem] px-[2.4rem] py-[1.6rem] border border-gray-200 rounded-[0.8rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}
