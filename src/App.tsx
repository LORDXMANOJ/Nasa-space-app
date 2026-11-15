/**
 * Root: hash router (works from file:// for the later Electron build), theme/accessibility attributes
 * on <html>, first-run onboarding, and the screen routes. Heavy screens (3D body, charts) load lazily.
 */
import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { Shell } from "./layout/Shell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { WhoAreYou } from "./screens/WhoAreYou";
import { DemoOverlay } from "./demo/DemoOverlay";
import { useMission } from "./store/mission";
import { useCrew } from "./store/crew";
import { Onboarding } from "./screens/onboarding/Onboarding";
import { SignIn } from "./screens/onboarding/SignIn";
import { Dashboard } from "./screens/Dashboard";
import { MeasureList, MeasureFlow } from "./screens/Measure";
import { Recovery } from "./screens/Recovery";
import { Hazards } from "./screens/Hazards";
import { Consult } from "./screens/Consult";
import { HowItDecides } from "./screens/HowItDecides";
import { Assistant } from "./screens/Assistant";
import { CheckIn } from "./screens/CheckIn";
import { Settings } from "./screens/Settings";
import { DevComponents } from "./screens/DevComponents";

const BodyReport = lazy(() => import("./screens/BodyReport"));
const Trends = lazy(() => import("./screens/Trends"));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById("main")?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function useHtmlAttributes() {
  const s = useMission((st) => st.settings);
  useEffect(() => {
    const h = document.documentElement;
    h.dataset.theme = s.highContrast ? "hc" : "dark";
    h.dataset.text = s.largeText ? "large" : "normal";
    h.dataset.motion = s.reducedMotion || s.lowPower ? "reduced" : "full";
    h.dataset.lowpower = String(s.lowPower);
  }, [s]);
}

export function App() {
  useHtmlAttributes();
  const hydrated = useMission((s) => s.hydrated);
  const crewHydrated = useCrew((s) => s.hydrated);
  const mode = useCrew((s) => s.mode);
  const setupDone = useCrew((s) => s.setupDone);
  const identified = useMission((s) => s.identified);
  if (!hydrated || !crewHydrated) return null;
  // first launch, or the mission setup is being changed
  if (mode === "new" || (mode === "mission" && !setupDone))
    return (
      <>
        <Onboarding />
        <DemoOverlay />
      </>
    );
  if (!identified)
    return (
      <>
        {mode === "mission" ? <SignIn /> : <WhoAreYou />}
        <DemoOverlay />
      </>
    );
  return (
    <HashRouter>
      <DemoOverlay />
      <ScrollTop />
      <Shell>
        <ScreenBoundary>
          <Suspense
            fallback={
              <div className="page skeleton" aria-busy="true" aria-label="Loading">
                <span />
                <span style={{ width: "72%" }} />
                <span style={{ width: "64%" }} />
                <span style={{ width: "48%" }} />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/measure" element={<MeasureList />} />
              <Route path="/measure/:id" element={<MeasureFlow />} />
              <Route path="/body" element={<BodyReport />} />
              <Route path="/recovery" element={<Recovery />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/hazards" element={<Hazards />} />
              <Route path="/checkin" element={<CheckIn />} />
              <Route path="/consult" element={<Consult />} />
              <Route path="/how" element={<HowItDecides />} />
              <Route path="/sources" element={<HowItDecides />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/dev/components" element={<DevComponents />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </ScreenBoundary>
      </Shell>
    </HashRouter>
  );
}

/** One error boundary per screen: a crash shows a plain message with a way forward, and moving to another screen clears it. */
function ScreenBoundary({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return <ErrorBoundary resetKey={loc.pathname}>{children}</ErrorBoundary>;
}
