import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { AppShell } from "@/ui/AppShell";
import { CoachView } from "@/ui/coach/CoachView";
import { SetupView } from "@/ui/setup/SetupView";
import { TodayView } from "@/ui/today/TodayView";
import { WeekView } from "@/ui/week/WeekView";

export function App() {
  return (
    <HouseholdProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<TodayView />} />
            <Route path="/week" element={<WeekView />} />
            <Route path="/coach" element={<CoachView />} />
            <Route path="/setup" element={<SetupView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </HouseholdProvider>
  );
}
