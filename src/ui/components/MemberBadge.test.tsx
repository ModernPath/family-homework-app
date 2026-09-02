import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberBadge } from "@/ui/components/MemberBadge";

describe("MemberBadge", () => {
  it("shows avatar and name when avatar is set", () => {
    render(
      <MemberBadge
        member={{ name: "Dad", color: "#22C55E", avatar: "👨" }}
        visual="list"
      />,
    );

    expect(screen.getByText("👨")).toBeTruthy();
    expect(screen.getByText("Dad")).toBeTruthy();
  });

  it("shows color dot when avatar is missing", () => {
    const { container } = render(
      <MemberBadge member={{ name: "Emma", color: "#3B82F6", avatar: null }} />,
    );

    const dot = container.querySelector(".member-badge__dot") as HTMLElement;
    expect(dot).toBeTruthy();
    expect(dot.style.backgroundColor).toBe("rgb(59, 130, 246)");
    expect(screen.getByText("Emma")).toBeTruthy();
  });
});
