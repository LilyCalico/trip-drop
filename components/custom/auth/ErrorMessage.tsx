import { cn } from "@/lib/utils";

const ErrorMessage = ({
  message,
  className
}: {
  message: string;
  className?: string;
}) => {
  return (
    <div className={cn("mt-1 text-red-500 text-[1.2rem]", className)}>
      {message}
    </div>
  );
};

export default ErrorMessage;
