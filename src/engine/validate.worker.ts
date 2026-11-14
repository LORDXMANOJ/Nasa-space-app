/** Runs the Monte Carlo validation off the main thread so the UI stays responsive, reporting progress as it goes. */
import { runValidation } from "./validate";

self.onmessage = (e: MessageEvent<{ n: number; seed: number }>) => {
  const post = (m: unknown) => (self as unknown as Worker).postMessage(m);
  const result = runValidation(e.data.n, e.data.seed, (done) => post({ type: "progress", done }));
  post({ type: "done", result });
};
