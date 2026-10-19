import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "size-7 text-[10px]", md: "size-9 text-xs", lg: "size-12 text-sm" };

/** The only way a person is shown as an avatar: photo, or their initials. */
export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  return (
    <Avatar className={cn(sizes[size], className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
