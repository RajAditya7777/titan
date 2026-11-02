import { describe, expect, it } from "vitest";
import { keepOnDocs } from "@/lib/server/llm/orchestrator";
import type { CompanionReply } from "@/lib/companion/actions";

const withTour = { speech: "Here's how it works.", workflow: { id: "titan_tour", title: "Tour", steps: [] }, toolCalls: [] } as unknown as CompanionReply;

describe("questions on the docs page stay on the docs page", () => {
  it("drops a walkthrough for a question and points at the article", () => {
    const r = keepOnDocs({ page: "titan_docs", utterance: "What is Titan Exchange?" }, withTour);
    expect(r.workflow).toBeUndefined();
    expect(r.point?.target).toBe("titan-docs-reading-pane");
    expect(r.speech).toBe("Here's how it works.");
  });
  it("keeps it for explicit actions, and on other pages", () => {
    expect(keepOnDocs({ page: "titan_docs", utterance: "Help me swap 1 SOL" }, withTour).workflow).toBeDefined();
    expect(keepOnDocs({ page: "titan_swap", utterance: "What is Titan Exchange?" }, withTour).workflow).toBeDefined();
  });
});
