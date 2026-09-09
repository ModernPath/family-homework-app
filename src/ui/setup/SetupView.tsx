import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { MembersPanel } from "@/ui/setup/MembersPanel";
import { TasksPanel } from "@/ui/setup/TasksPanel";
import { RewardsPanel } from "@/ui/setup/RewardsPanel";
import { BackupPanel } from "@/ui/setup/BackupPanel";

type SetupTab = "members" | "tasks" | "rewards" | "backup";

const TAB_KEYS: Record<SetupTab, "setup.tab.members" | "setup.tab.tasks" | "setup.tab.rewards" | "setup.tab.backup"> = {
  members: "setup.tab.members",
  tasks: "setup.tab.tasks",
  rewards: "setup.tab.rewards",
  backup: "setup.tab.backup",
};

export function SetupView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SetupTab>("members");

  return (
    <div>
      <h1 className="page-title">{t("setup.title")}</h1>
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
            {t(TAB_KEYS[name])}
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
