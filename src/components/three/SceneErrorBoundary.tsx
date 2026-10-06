"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendered when the 3D layer throws (e.g. WebGL context creation fails). */
  fallback: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  failed: boolean;
}

/**
 * ── SCENE ERROR BOUNDARY ──────────────────────────────────────
 * A WebGL context can fail to create for reasons that are not detectable
 * up-front (driver blocklists, exhausted GPU memory, headless quirks). R3F
 * throws during render in that case, which would otherwise take the whole page
 * down. Catching here lets the site degrade to the 2D experience instead.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface it in the console for debugging, but never block the page.
    console.warn("[solar] 3D scene failed, falling back to 2D:", error.message);
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export default SceneErrorBoundary;
