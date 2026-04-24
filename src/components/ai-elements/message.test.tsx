import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThinkingMessage } from "@/components/ai-elements/message";

describe("ThinkingMessage", () => {
  it("renders an accessible animated thinking state", () => {
    render(<ThinkingMessage label="Friday is thinking" />);

    expect(screen.getByLabelText("Friday is thinking")).toBeInTheDocument();
    expect(screen.getByText("Friday is thinking")).toBeInTheDocument();
  });
});
