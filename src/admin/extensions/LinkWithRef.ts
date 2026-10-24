// src/admin/extensions/LinkWithRef.ts
import Link from "@tiptap/extension-link";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/** An absolute http(s) or protocol-relative URL: somewhere else on the web. */
const leavesSite = (href: unknown) => typeof href === "string" && /^(https?:)?\/\//i.test(href.trim());

/**
 * Extended Link extension that supports internal content references.
 *
 * For external links: stores href as normal
 * For internal links: stores contentRef as "schema:id" format
 *
 * HTML output:
 * - External: <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">text</a>
 * - Internal: <a href="#" data-content-ref="posts:abc123">text</a>
 * - A path, anchor or email address: <a href="/articles/x">text</a>
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

  // Only a link that leaves the site opens in a new tab. A page on this site
  // (by path or picked from the CMS), an anchor or an email address is a
  // plain link, even if it was saved with a target before.
  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes["data-content-ref"] || !leavesSite(HTMLAttributes.href)) {
      const { target: _target, rel: _rel, ...attributes } = HTMLAttributes;
      return ["a", attributes, 0];
    }
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
