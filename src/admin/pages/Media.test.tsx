import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Media from "./Media";
import { api } from "../lib/api";
import { fakeLibrary } from "../test/fakeLibrary";
import type { MediaItemResponse } from "../../lib/media";

const items: MediaItemResponse[] = [
  {
    id: "1",
    filename: "cover.jpg",
    path: "/uploads/cover.jpg",
    mimetype: "image/jpeg",
    kind: "image",
    size: 2048,
    created_at: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "2",
    filename: "1996_Govor_Russian_perceptions.pdf",
    path: "/uploads/essay.pdf",
    mimetype: "application/pdf",
    kind: "document",
    size: 1024 * 1024,
    created_at: "2026-08-02T00:00:00.000Z",
  },
  {
    id: "3",
    filename: "interview.mp3",
    path: "/uploads/interview.mp3",
    mimetype: "audio/mpeg",
    kind: "audio",
    size: 4096,
    created_at: "2026-08-03T00:00:00.000Z",
  },
];

function dataTransfer(files: File[]) {
  return { files, items: [], types: ["Files"] };
}

beforeEach(() => {
  // The api mock lives in the shared test setup, so call history survives
  // between tests unless it is cleared here.
  vi.clearAllMocks();
  vi.mocked(api.getMedia).mockImplementation(fakeLibrary(items));
  vi.mocked(api.uploadMedia).mockResolvedValue({
    data: { id: "new", path: "/uploads/new.pdf" },
  } as never);
});

describe("Media library", () => {
  it("lists images and documents together", async () => {
    render(<Media />);

    expect(await screen.findByText("cover.jpg")).toBeInTheDocument();
    expect(screen.getByText("1996_Govor_Russian_perceptions.pdf")).toBeInTheDocument();
    expect(screen.getByText("interview.mp3")).toBeInTheDocument();
  });

  it("gives a document a link that opens the file", async () => {
    render(<Media />);

    const link = await screen.findByRole("link", {
      name: /1996_Govor_Russian_perceptions\.pdf/i,
    });
    expect(link).toHaveAttribute("href", "/uploads/essay.pdf");
  });

  it("filters to documents only", async () => {
    render(<Media />);
    await screen.findByText("cover.jpg");

    await userEvent.click(screen.getByRole("button", { name: /documents/i }));

    expect(screen.getByText("1996_Govor_Russian_perceptions.pdf")).toBeInTheDocument();
    expect(screen.queryByText("cover.jpg")).not.toBeInTheDocument();
    expect(screen.queryByText("interview.mp3")).not.toBeInTheDocument();
  });

  it("filters to images only", async () => {
    render(<Media />);
    await screen.findByText("cover.jpg");

    await userEvent.click(screen.getByRole("button", { name: /^images/i }));

    expect(screen.getByText("cover.jpg")).toBeInTheDocument();
    expect(
      screen.queryByText("1996_Govor_Russian_perceptions.pdf")
    ).not.toBeInTheDocument();
  });

  it("uploads every file dropped on the page", async () => {
    render(<Media />);
    await screen.findByText("cover.jpg");

    const files = [
      new File(["a"], "one.pdf", { type: "application/pdf" }),
      new File(["b"], "two.pdf", { type: "application/pdf" }),
    ];
    fireEvent.drop(screen.getByTestId("dropzone"), { dataTransfer: dataTransfer(files) });

    await waitFor(() => expect(api.uploadMedia).toHaveBeenCalledTimes(2));
    expect(vi.mocked(api.uploadMedia).mock.calls.map((c) => (c[0] as File).name)).toEqual([
      "one.pdf",
      "two.pdf",
    ]);
  });

  it("refreshes the library after uploading", async () => {
    render(<Media />);
    await screen.findByText("cover.jpg");
    vi.mocked(api.getMedia).mockClear();

    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: dataTransfer([new File(["a"], "one.pdf", { type: "application/pdf" })]),
    });

    await waitFor(() => expect(api.getMedia).toHaveBeenCalled());
  });

  it("reports the files that failed without hiding the ones that worked", async () => {
    vi.mocked(api.uploadMedia)
      .mockRejectedValueOnce(new Error("Files of type application/x-msdownload can't be uploaded"))
      .mockResolvedValueOnce({ data: { id: "ok", path: "/uploads/ok.pdf" } } as never);

    render(<Media />);
    await screen.findByText("cover.jpg");

    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: dataTransfer([
        new File(["a"], "installer.exe", { type: "application/x-msdownload" }),
        new File(["b"], "fine.pdf", { type: "application/pdf" }),
      ]),
    });

    expect(await screen.findByText(/installer\.exe/)).toBeInTheDocument();
    expect(screen.getByText(/can't be uploaded/i)).toBeInTheDocument();
    await waitFor(() => expect(api.uploadMedia).toHaveBeenCalledTimes(2));
  });

  it("tells the user what to do when the library is empty", async () => {
    vi.mocked(api.getMedia).mockImplementation(fakeLibrary([]));
    render(<Media />);

    expect(await screen.findByText(/no files yet/i)).toBeInTheDocument();
    expect(screen.getByText(/drag/i)).toBeInTheDocument();
  });
});
