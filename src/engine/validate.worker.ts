/** Runs the Monte Carlo validation off the main thread so the UI stays responsive. */
import { runValidation } from "./validate";

self.onmessage = (e: MessageEvent<{ n: number; seed: number }>) => {
  const r = runValidation(e.data.n, e.data.seed);
  (self as unknown as Worker).postMessage(r);
};
