import { Input as BaseInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof BaseInput>;

export function Input({ className, ...props }: Props) {
  return (
    <BaseInput
      className={cn(
        // 背景・余白・フォントサイズを移植
        "py-[1.6rem] text-[1.4rem] mt-[0.4rem]",
        "input-custom",
        className
      )}
      {...props}
    />
  );
}

export default Input;
