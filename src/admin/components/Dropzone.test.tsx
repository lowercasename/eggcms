import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dropzone from "./Dropzone";

function dataTransfer(files: File[]) {
  return {
    files,
    items: files.map((f) => ({ kind: "file", type: f.type, getAsFile: () => f })),
    types: ["Files"],
  };
}

const pdf = () => new File(["pdf"], "essay.pdf", { type: "application/pdf" });

describe("Dropzone", () => {
  it("renders its children", () => {
    render(
      <Dropzone onFiles={vi.fn()}>
        <p>Library contents</p>
      </Dropzone>
    );
    expect(screen.getByText("Library contents")).toBeInTheDocument();
  });

  it("shows an overlay while files are dragged over it", () => {
    render(<Dropzone onFiles={vi.fn()}>content</Dropzone>);

    expect(screen.queryByTestId("dropzone-overlay")).not.toBeInTheDocument();

    fireEvent.dragEnter(screen.getByTestId("dropzone"), {
      dataTransfer: dataTransfer([pdf()]),
    });

    expect(screen.getByTestId("dropzone-overlay")).toBeInTheDocument();
  });

  it("hides the overlay again when the drag leaves", () => {
    render(<Dropzone onFiles={vi.fn()}>content</Dropzone>);
    const zone = screen.getByTestId("dropzone");

    fireEvent.dragEnter(zone, { dataTransfer: dataTransfer([pdf()]) });
    fireEvent.dragLeave(zone);

    expect(screen.queryByTestId("dropzone-overlay")).not.toBeInTheDocument();
  });

  it("calls onFiles with the dropped files and clears the overlay", () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles}>content</Dropzone>);
    const zone = screen.getByTestId("dropzone");

    fireEvent.dragEnter(zone, { dataTransfer: dataTransfer([pdf()]) });
    fireEvent.drop(zone, { dataTransfer: dataTransfer([pdf()]) });

    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0][0].map((f: File) => f.name)).toEqual(["essay.pdf"]);
    expect(screen.queryByTestId("dropzone-overlay")).not.toBeInTheDocument();
  });

  it("passes every file when several are dropped at once", () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles}>content</Dropzone>);

    const files = [
      pdf(),
      new File(["img"], "cover.jpg", { type: "image/jpeg" }),
    ];
    fireEvent.drop(screen.getByTestId("dropzone"), { dataTransfer: dataTransfer(files) });

    expect(onFiles.mock.calls[0][0]).toHaveLength(2);
  });

  it("ignores a drop with no files, such as dragged text", () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles}>content</Dropzone>);

    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: { files: [], items: [], types: ["text/plain"] },
    });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it("does not react while disabled", () => {
    const onFiles = vi.fn();
    render(
      <Dropzone onFiles={onFiles} disabled>
        content
      </Dropzone>
    );
    const zone = screen.getByTestId("dropzone");

    fireEvent.dragEnter(zone, { dataTransfer: dataTransfer([pdf()]) });
    expect(screen.queryByTestId("dropzone-overlay")).not.toBeInTheDocument();

    fireEvent.drop(zone, { dataTransfer: dataTransfer([pdf()]) });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("shows a custom label in the overlay", () => {
    render(
      <Dropzone onFiles={vi.fn()} label="Drop PDFs here">
        content
      </Dropzone>
    );

    fireEvent.dragEnter(screen.getByTestId("dropzone"), {
      dataTransfer: dataTransfer([pdf()]),
    });

    expect(screen.getByText("Drop PDFs here")).toBeInTheDocument();
  });
});
