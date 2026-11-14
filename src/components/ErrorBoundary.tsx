/**
 * Catches a crash inside one screen so the crew never sees a blank page.
 * The message says what happened, why, and what to do next. No code or stack trace is shown:
 * it would mean nothing to the crew and could expose how the app works inside.
 */
import { Component, type ReactNode } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Changes when the screen changes, so moving to another screen clears the error. */
  resetKey: string;
}
interface State {
  failed: boolean;
  key: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, key: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }
  componentDidCatch(error: unknown) {
    console.error("Screen crashed:", error); // for developers only; the crew sees the plain message below
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="page">
        <section
          className="block block--watch"
          role="alert"
          aria-labelledby="crash-title"
          style={{ maxWidth: 760 }}
        >
          <div className="block-head">
            <TriangleAlert aria-hidden /> This screen stopped
          </div>
          <div className="block-body stack" style={{ gap: "var(--sp-3)" }}>
            <h2 id="crash-title">This screen hit a problem and could not be shown</h2>
            <p>
              A part of the app failed while drawing this screen. It is a fault in the app, not something you
              did. <strong>Your readings and check-ins are safe</strong>: they are saved on this device.
            </p>
            <p>
              Reload the screen. If it happens again, use the other screens and tell your Crew Medical
              Officer.
            </p>
            <div className="row">
              <button className="btn btn--primary btn--lg" onClick={() => this.setState({ failed: false })}>
                <RotateCcw aria-hidden /> Reload this screen
              </button>
              <a className="btn btn--lg" href="#/">
                Go to the dashboard
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
