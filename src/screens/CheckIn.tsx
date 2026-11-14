/**
 * Daily check-in page: the same form as step 3 of the dashboard (Earth value beside each of today's readings).
 * After saving it returns to the dashboard, where the results appear on the 3D body.
 */
import { useNavigate } from "react-router-dom";
import { CheckInForm } from "../components/CheckInForm";
import { useHealth } from "../store/health";

export function CheckIn() {
  const h = useHealth();
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Daily check-in</h1>
          <p className="lede">
            Day {h.day}. About a minute. Your wearable filled the first rows; measure or type the rest. Your
            Earth reading is beside each one.
          </p>
        </div>
      </div>
      <CheckInForm onDone={() => navigate("/")} />
    </div>
  );
}
