import {
  TriangleFanDrawMode,
  TriangleStripDrawMode,
  TrianglesDrawMode,
} from './three.module.min.js';

/** Stub: the Zoth companion GLB is already triangles. */
export function toTrianglesDrawMode(geometry, drawMode) {
  if (drawMode === TriangleFanDrawMode || drawMode === TriangleStripDrawMode) {
    return geometry;
  }
  if (drawMode === TrianglesDrawMode) return geometry;
  return geometry;
}
