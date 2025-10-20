import type { MindMapData } from "@/lib/types";

export const mockMindMap: MindMapData = {
  mapId: "mock-map-1",
  title: "The Theory of Relativity",
  createdAt: new Date().toISOString(),
  nodes: [
    {
      nodeId: "1",
      label: "Theory of Relativity",
      type: "concept",
      shape: "rounded",
      color: "#171A21",
      importanceScore: 0.95,
      confidence: 0.98,
      tl_dr:
        "A theory by Einstein explaining that space and time are relative and interwoven into a single continuum known as spacetime.",
      detailed:
        "The theory of relativity, developed by Albert Einstein, is a cornerstone of modern physics. It is composed of two main parts: Special Relativity and General Relativity. Special Relativity deals with the physics of objects moving at constant speeds, introducing the concept that the laws of physics are the same for all non-accelerating observers. General Relativity is a theory of gravitation, proposing that gravity is the result of the curvature of spacetime caused by mass and energy.",
      analogy:
        "Think of spacetime as a trampoline. Placing a heavy bowling ball (a planet or star) in the center causes the trampoline to sag. If you roll a marble (another object) nearby, it will curve towards the bowling ball, not because of a mysterious force, but because the fabric of the trampoline itself is curved.",
      position: { x: 450, y: 300, z: 0 },
      sourceRefs: [],
    },
    {
      nodeId: "2",
      label: "Special Relativity",
      type: "concept",
      shape: "rounded",
      color: "#171A21",
      importanceScore: 0.8,
      confidence: 0.95,
      tl_dr:
        "Objects in uniform motion experience the same physical laws. The speed of light is constant for all observers.",
      detailed:
        "Published in 1905, Special Relativity is based on two postulates: 1. The laws of physics are invariant in all inertial frames of reference. 2. The speed of light in a vacuum is the same for all observers, regardless of the motion of the light source or observer. This leads to counter-intuitive consequences like time dilation and length contraction.",
      analogy:
        "Imagine two people with synchronized watches. One stays on Earth, and the other travels in a very fast spaceship. When the traveler returns, their watch will show less time has passed compared to the person who stayed on Earth. Time itself slows down for the traveler.",
      position: { x: 200, y: 150, z: 0 },
      sourceRefs: [],
    },
    {
      nodeId: "3",
      label: "General Relativity",
      type: "concept",
      shape: "rounded",
      color: "#171A21",
      importanceScore: 0.85,
      confidence: 0.96,
      tl_dr:
        "Gravity is not a force but a curvature of spacetime caused by mass and energy.",
      detailed:
        "Published in 1915, General Relativity describes gravity as a geometric property of spacetime. Massive objects warp the spacetime around them, and this curvature dictates how other objects move. Its predictions, such as gravitational lensing and the existence of black holes, have been confirmed by numerous observations.",
      analogy:
        "As mentioned, it's like a bowling ball on a trampoline. The ball doesn't pull marbles towards it; it changes the shape of the surface, and the marbles follow that new shape.",
      position: { x: 700, y: 150, z: 0 },
      sourceRefs: [],
    },
    {
      nodeId: "4",
      label: "E=mc²",
      type: "formula",
      shape: "square",
      color: "#3498DB",
      importanceScore: 0.9,
      confidence: 1,
      tl_dr: "Mass and energy are equivalent and can be converted into one another.",
      detailed:
        "This iconic equation is a consequence of Special Relativity. It states that energy (E) equals mass (m) times the speed of light (c) squared. Because the speed of light is a very large number, a small amount of mass can be converted into a tremendous amount of energy, as seen in nuclear reactions.",
      analogy:
        "Think of mass as a highly compressed form of energy, like a tightly coiled spring. The equation tells you exactly how much energy is stored inside that spring if you could uncoil it completely.",
      position: { x: 200, y: 450, z: 0 },
      sourceRefs: [],
    },
    {
      nodeId: "5",
      label: "Black Holes",
      type: "warning",
      shape: "circle",
      color: "#E74C3C",
      importanceScore: 0.7,
      confidence: 0.92,
      tl_dr:
        "A region of spacetime where gravity is so strong that nothing, not even light, can escape.",
      detailed:
        "Black holes are predicted by General Relativity. They form when a very massive star collapses under its own gravity at the end of its life. The point of no return is called the event horizon. Crossing it is a one-way trip.",
      analogy:
        "Imagine a waterfall with a current that gets stronger and stronger as you approach the edge. At a certain point, the 'event horizon,' the current is faster than any boat can travel, and escape becomes impossible.",
      position: { x: 700, y: 450, z: 0 },
      sourceRefs: [],
    },
  ],
  edges: [
    { from: "1", to: "2", relation: "supports", weight: 0.9 },
    { from: "1", to: "3", relation: "supports", weight: 0.9 },
    { from: "2", to: "4", relation: "cause", weight: 0.8 },
    { from: "3", to: "5", relation: "cause", weight: 0.8 },
  ],
  exportMeta: {
    exportedBy: "CMA-mock",
    mode: "full",
  },
};
