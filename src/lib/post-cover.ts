import type { CSSProperties } from "react";

type CoverProps = {
  className: string;
  style?: CSSProperties;
  isImage: boolean;
};

const IMAGE_PREFIXES = ["http://", "https://", "/", "data:"];

export function getPostCoverProps(cover?: string | null): CoverProps {
  const value = (cover ?? "").trim();
  if (!value) {
    return { className: "blog-cover", isImage: false };
  }

  const isImage = IMAGE_PREFIXES.some((prefix) => value.startsWith(prefix));
  if (!isImage) {
    return { className: `blog-cover ${value}`, isImage: false };
  }

  return {
    className: "blog-cover blog-cover-image",
    style: { backgroundImage: `url(${value})` },
    isImage: true,
  };
}
