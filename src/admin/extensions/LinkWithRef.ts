// src/admin/extensions/LinkWithRef.ts
import Link from "@tiptap/extension-link";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * Extended Link extension that supports internal content references.
 *
 * For external links: stores href as normal
 * For internal links: stores contentRef as "schema:id" format
 *
 * HTML output:
 * - External: <a href="https://example.com">text</a>
 * - Internal: <a href="#" data-content-ref="posts:abc123">text</a>
 */
export const LinkWithRef = Link.extend({
  // Ensure links don't open on click by default
  inclusive: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      contentRef: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-content-ref"),
        renderHTML: (attributes) => {
          if (!attributes.contentRef) return {};
          return {
            "data-content-ref": attributes.contentRef,
            href: "#", // Placeholder for internal links
          };
        },
      },
    };
  },

  // Override renderHTML to handle internal links properly
  renderHTML({ HTMLAttributes }) {
    // If it's an internal link, ensure href is set to #
    if (HTMLAttributes.contentRef) {
      return [
        "a",
        {
          ...HTMLAttributes,
          href: "#",
          "data-content-ref": HTMLAttributes.contentRef,
        },
        0,
      ];
    }
    // External link - render normally
    return ["a", HTMLAttributes, 0];
  },

  // Add plugin to prevent link clicks from navigating
  addProseMirrorPlugins() {
    const plugins = this.parent?.() || [];

    return [
      ...plugins,
      new Plugin({
        key: new PluginKey("linkClickHandler"),
        props: {
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement;
            const link = target.closest("a");
            if (link) {
              // Prevent navigation on all link clicks within the editor
              event.preventDefault();
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

export default LinkWithRef;
