declare module "*.mdx" {
  import React from "react";
  const MDXComponent: React.ComponentType<unknown>;
  export default MDXComponent;
}
