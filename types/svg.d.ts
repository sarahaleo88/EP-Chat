/**
 * SVG Module Declarations
 * Allows importing SVG files as React components
 */

declare module '*.svg' {
  import React from 'react';
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

