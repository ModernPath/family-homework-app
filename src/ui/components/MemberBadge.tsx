import type { ReactNode } from "react";
import type { Member } from "@/domain/types";

export type MemberBadgeVisual = "list" | "inline";

interface MemberBadgeProps {
  member: Pick<Member, "name" | "color" | "avatar">;
  visual?: MemberBadgeVisual;
  showName?: boolean;
  className?: string;
  dotClassName?: string;
  avatarClassName?: string;
  nameClassName?: string;
  children?: ReactNode;
}

export function MemberBadge({
  member,
  visual = "inline",
  showName = true,
  className,
  dotClassName,
  avatarClassName,
  nameClassName,
  children,
}: MemberBadgeProps) {
  const dotCls =
    dotClassName ?? (visual === "list" ? "item-card__dot" : "member-badge__dot");
  const avatarCls =
    avatarClassName ?? (visual === "list" ? "item-card__avatar" : "member-badge__avatar");

  return (
    <span className={["member-badge", className].filter(Boolean).join(" ")}>
      {member.avatar ? (
        <span className={avatarCls}>{member.avatar}</span>
      ) : (
        <span
          className={dotCls}
          style={{ backgroundColor: member.color }}
          aria-hidden="true"
        />
      )}
      {showName && (
        <span className={nameClassName ?? "member-badge__name"}>{member.name}</span>
      )}
      {children}
    </span>
  );
}
