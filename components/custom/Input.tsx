import { Input as BaseInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof BaseInput>;

export function Input({ className, ...props }: Props) {
  return (
    <BaseInput
      className={cn(
        // 背景・余白・フォントサイズを移植
        "bg-white pl-[1.2rem] py-[1.6rem] text-[1.4rem] mt-[0.4rem]",
        // 枠色をカスタムトークン gray-light に（Tailwind v4 カスタム）
        "border-[var(--color-gray-light)] shadow-none",
        className
      )}
      {...props}
    />
  );
}

export default Input;
