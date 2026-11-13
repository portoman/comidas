import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// next/image y next/link: sustitutos sencillos para jsdom.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, priority: _priority, ...rest } = props;
    void _fill;
    void _priority;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

// jsdom no implementa scrollTo.
window.scrollTo = () => {};
