// src/admin/extensions/ImageWithControls.ts
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageNodeView from "../components/richtext/ImageNodeView";

export const ImageWithControls = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "medium",
        parseHTML: (element) => element.getAttribute("data-size") || "medium",
        renderHTML: (attributes) => ({
          "data-size": attributes.size,
        }),
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-width") || null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { "data-width": attributes.width };
        },
      },
      alt: {
        default: "",
        parseHTML: (element) => element.getAttribute("alt") || "",
        renderHTML: (attributes) => ({
          alt: attributes.alt || "",
        }),
      },
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") || "",
        renderHTML: (attributes) => {
          if (!attributes.caption) return {};
          return { "data-caption": attributes.caption };
        },
      },
      alignment: {
        default: "center",
        parseHTML: (element) =>
          element.getAttribute("data-alignment") || "center",
        renderHTML: (attributes) => ({
          "data-alignment": attributes.alignment,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

export default ImageWithControls;
