import { useState } from "react";
import { MembersPanel } from "@/ui/setup/MembersPanel";
import { TasksPanel } from "@/ui/setup/TasksPanel";
import { RewardsPanel } from "@/ui/setup/RewardsPanel";
import { BackupPanel } from "@/ui/setup/BackupPanel";

type SetupTab = "members" | "tasks" | "rewards" | "backup";

export function SetupView() {
  const [tab, setTab] = useState<SetupTab>("members");

  return (
    <div>
      <h1 className="page-title">Setup</h1>
      <nav className="setup-tabs" role="tablist">
        {(["members", "tasks", "rewards", "backup"] as SetupTab[]).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className="setup-tab"
            onClick={() => setTab(name)}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "members" && <MembersPanel />}
      {tab === "tasks" && <TasksPanel />}
      {tab === "rewards" && <RewardsPanel />}
      {tab === "backup" && <BackupPanel />}
    </div>
  );
}
