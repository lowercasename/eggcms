// src/admin/components/richtext/LinkModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LinkModal from "./LinkModal";
import { api } from "../../lib/api";

beforeEach(() => {
  vi.mocked(api.getSchemas).mockResolvedValue({ data: [] });
});

describe("LinkModal external URL normalization", () => {
  it("prepends https:// to bare hostnames", () => {
    const onSaveExternal = vi.fn();
    render(
      <LinkModal
        currentHref="example.com"
        onSaveExternal={onSaveExternal}
        onSaveInternal={() => {}}
        onRemove={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Update"));
    expect(onSaveExternal).toHaveBeenCalledWith("https://example.com");
  });

  it("leaves https:// URLs unchanged", () => {
    const onSaveExternal = vi.fn();
    render(
      <LinkModal
        currentHref="https://example.com"
        onSaveExternal={onSaveExternal}
        onSaveInternal={() => {}}
        onRemove={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Update"));
    expect(onSaveExternal).toHaveBeenCalledWith("https://example.com");
  });

  it("leaves relative paths unchanged", () => {
    const onSaveExternal = vi.fn();
    render(
      <LinkModal
        currentHref="/about"
        onSaveExternal={onSaveExternal}
        onSaveInternal={() => {}}
        onRemove={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Update"));
    expect(onSaveExternal).toHaveBeenCalledWith("/about");
  });

  it("leaves anchor links unchanged", () => {
    const onSaveExternal = vi.fn();
    render(
      <LinkModal
        currentHref="#section-2"
        onSaveExternal={onSaveExternal}
        onSaveInternal={() => {}}
        onRemove={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Update"));
    expect(onSaveExternal).toHaveBeenCalledWith("#section-2");
  });
});
