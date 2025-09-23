import type { VariantProps } from "class-variance-authority";
import { Button as BaseButton, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export default function Button({ className, ...props }: Props) {
  return (
    <BaseButton
      className={cn(
        "bg-black text-[1.2rem] text-white px-[1.6rem] py-[1.6rem]",
        className
      )}
      {...props}
    />
  );
}
