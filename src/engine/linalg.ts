/**
 * Small linear-algebra kit for the "unusual day" detector.
 * Schäfer–Strimmer shrinkage of the correlation matrix toward the identity (intensity estimated from the data),
 * Cholesky factorisation Σ = L Lᵀ and triangular solves. We never invert Σ directly.
 * Rows may contain NaN for skipped readings; statistics use pairwise-complete rows.
 */
export type Matrix = number[][];

const isNum = (v: number) => Number.isFinite(v);

export function columnStats(rows: number[][], p: number) {
  const mean = new Array(p).fill(0);
  const sd = new Array(p).fill(0);
  const n = new Array(p).fill(0);
  for (let j = 0; j < p; j++) {
    const col = rows.map((r) => r[j]).filter(isNum);
    n[j] = col.length;
    mean[j] = col.length ? col.reduce((a, b) => a + b, 0) / col.length : NaN;
    const ss = col.reduce((a, b) => a + (b - mean[j]) ** 2, 0);
    sd[j] = col.length > 1 ? Math.sqrt(ss / (col.length - 1)) : NaN;
  }
  return { mean, sd, n };
}

/**
 * Shrunk correlation matrix (Schäfer & Strimmer 2005, target = identity).
 * λ* = Σ_{i≠j} Var̂(r_ij) / Σ_{i≠j} r_ij², clipped to [0, 1]; R* = (1 − λ*) R off the diagonal, 1 on it.
 */
export function shrunkCorrelation(rows: number[][], mean: number[], sd: number[]): { R: Matrix; lambda: number } {
  const p = mean.length;
  const R: Matrix = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => (i === j ? 1 : 0)));
  let num = 0;
  let den = 0;
  for (let i = 0; i < p; i++) {
    for (let j = i + 1; j < p; j++) {
      const w: number[] = [];
      for (const r of rows) {
        if (isNum(r[i]) && isNum(r[j]) && sd[i] > 0 && sd[j] > 0) w.push(((r[i] - mean[i]) / sd[i]) * ((r[j] - mean[j]) / sd[j]));
      }
      const n = w.length;
      if (n < 3) continue; // not enough overlap: leave at 0 (fully shrunk)
      const wbar = w.reduce((a, b) => a + b, 0) / n;
      const r = (n / (n - 1)) * wbar;
      const varR = (n / (n - 1) ** 3) * w.reduce((a, b) => a + (b - wbar) ** 2, 0);
      R[i][j] = R[j][i] = r;
      num += 2 * varR;
      den += 2 * r * r;
    }
  }
  const lambda = den === 0 ? 1 : Math.min(1, Math.max(0, num / den));
  for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) if (i !== j) R[i][j] *= 1 - lambda;
  return { R, lambda };
}

/** Σ = D R D where D = diag(sd). */
export function covFromCorr(R: Matrix, sd: number[]): Matrix {
  return R.map((row, i) => row.map((r, j) => r * sd[i] * sd[j]));
}

/** Lower-triangular L with A = L Lᵀ. Adds a tiny ridge if A is not positive definite. */
export function cholesky(A: Matrix): Matrix {
  const n = A.length;
  for (let attempt = 0; attempt < 6; attempt++) {
    const ridge = attempt === 0 ? 0 : 1e-9 * 10 ** attempt * Math.max(...A.map((r, i) => r[i]));
    const L: Matrix = Array.from({ length: n }, () => new Array(n).fill(0));
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      for (let j = 0; j <= i; j++) {
        let s = A[i][j] + (i === j ? ridge : 0);
        for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        if (i === j) {
          if (s <= 0) {
            ok = false;
            break;
          }
          L[i][i] = Math.sqrt(s);
        } else L[i][j] = s / L[j][j];
      }
    }
    if (ok) return L;
  }
  throw new Error("Matrix is not positive definite");
}

/** Solve L y = b (forward substitution). */
export function forwardSolve(L: Matrix, b: number[]): number[] {
  const y = new Array(b.length).fill(0);
  for (let i = 0; i < b.length; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  return y;
}

/** Squared Mahalanobis distance d² = (x−μ)ᵀ Σ⁻¹ (x−μ) = ‖L⁻¹(x−μ)‖² via Cholesky. */
export function mahalanobis2(x: number[], mu: number[], cov: Matrix): number {
  const L = cholesky(cov);
  const y = forwardSolve(
    L,
    x.map((v, i) => v - mu[i]),
  );
  return y.reduce((a, b) => a + b * b, 0);
}

export const subMatrix = (A: Matrix, idx: number[]): Matrix => idx.map((i) => idx.map((j) => A[i][j]));

/** χ² 0.99 quantiles for 1–7 degrees of freedom (df = number of readings present). */
export const CHI2_99 = [NaN, 6.635, 9.21, 11.345, 13.277, 15.086, 16.812, 18.475];

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
