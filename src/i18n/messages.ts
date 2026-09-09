export type Locale = "en" | "fi";

export const LOCALES: Locale[] = ["en", "fi"];

export type MessageKey = keyof typeof en;

const en = {
  "nav.today": "Today",
  "nav.week": "Week",
  "nav.coach": "Coach",
  "nav.setup": "Setup",
  "nav.language": "Language",
  "nav.main": "Main",

  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.save": "Save",
  "common.update": "Update",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.deactivate": "Deactivate",
  "common.loading": "Loading…",
  "common.inactive": "inactive",
  "common.pts": "pts",
  "common.selectMember": "Select member",
  "common.selectReward": "Select reward",

  "today.anyone": "Anyone",
  "today.nothingScheduled": "Nothing scheduled today",
  "today.rewards": "Rewards",
  "today.mostActive": "{{name}} most active",

  "week.title": "This week",
  "week.task": "Task",
  "week.openTasks": "Open tasks",
  "week.anyone": "Anyone",

  "setup.title": "Setup",
  "setup.tab.members": "Members",
  "setup.tab.tasks": "Tasks",
  "setup.tab.rewards": "Rewards",
  "setup.tab.backup": "Backup",

  "members.add": "Add member",
  "members.edit": "Edit member",
  "members.name": "Name",
  "members.color": "Color",
  "members.avatar": "Avatar",
  "members.clearAvatar": "Clear avatar",
  "members.listLabel": "Members",
  "members.deleteConfirm": "Delete {{name}}? This cannot be undone.",

  "avatar.skinTone": "Skin tone",
  "avatar.style": "Style",
  "avatar.pets": "Pets",
  "avatar.robots": "Robots",
  "avatar.choose": "Choose an avatar",

  "tasks.add": "Add task",
  "tasks.edit": "Edit task",
  "tasks.title": "Title",
  "tasks.icon": "Icon",
  "tasks.chooseIcon": "Choose an icon",
  "tasks.schedule": "Schedule",
  "tasks.schedule.daily": "Daily",
  "tasks.schedule.weekdays": "Weekdays",
  "tasks.schedule.weekly": "Weekly",
  "tasks.schedule.once": "Once",
  "tasks.onTheseDays": "On these days",
  "tasks.dayOfWeek": "Day of week",
  "tasks.date": "Date",
  "tasks.assignment": "Assignment",
  "tasks.rotation": "Rotation",
  "tasks.pool": "Pool",
  "tasks.rotationOrder": "Rotation order",
  "tasks.points": "Points",
  "tasks.deactivateConfirm":
    'Deactivate "{{title}}"? It will no longer appear on the board.',

  "rewards.add": "Add reward",
  "rewards.redeem": "Redeem",
  "rewards.title": "Title",
  "rewards.cost": "Cost",
  "rewards.member": "Member",
  "rewards.reward": "Reward",
  "rewards.selectBoth": "Select member and reward",
  "rewards.redeemConfirm": 'Redeem "{{title}}" for {{name}}? Costs {{cost}} pts.',
  "rewards.deactivateConfirm":
    'Deactivate "{{title}}"? It will no longer appear in the rewards list.',
  "rewards.row": "{{title}} — {{cost}} pts",

  "backup.title": "Data backup",
  "backup.description":
    "Export your household data to a file, or restore from a previous backup.",
  "backup.export": "Export backup",
  "backup.import": "Import backup",
  "backup.loadSample": "Load Vuorio family sample",
  "backup.downloaded": "Backup downloaded",
  "backup.importComplete": "Import complete",
  "backup.sampleLoaded": "Vuorio family sample loaded",
  "backup.importConfirm": "Replace all data? This cannot be undone.",
  "backup.previewCounts":
    "This backup has {{members}} member(s) and {{tasks}} task(s).",
  "backup.samplePreview":
    "Loads Pasi, Minna, Sini, Saara, Miska with {{tasks}} chores and sample rewards.",

  "picker.whoDidIt": "Who did it?",

  "coach.title": "Coach",
  "coach.subtitle": "Ask who should do what, and who has done the most.",
  "coach.ask": "Ask",
  "coach.question": "Question",
  "coach.planToday": "Today's plan",
  "coach.planTodayQuery": "Who should do what today?",
  "coach.whoDidMost": "Who did the most?",
  "coach.whoDidMostQuery": "Who has done the most?",
  "coach.today": "Today",
  "coach.thisWeek": "This week",
  "coach.anyone": "Anyone",
  "coach.done": "done",
  "coach.open": "open",
  "coach.thinking": "Thinking…",
  "coach.unavailable": "Coach is unavailable. Start the homework coach API.",

  "weekday.mon": "Mon",
  "weekday.tue": "Tue",
  "weekday.wed": "Wed",
  "weekday.thu": "Thu",
  "weekday.fri": "Fri",
  "weekday.sat": "Sat",
  "weekday.sun": "Sun",
} as const;

const fi: Record<MessageKey, string> = {
  "nav.today": "Tänään",
  "nav.week": "Viikko",
  "nav.coach": "Valmentaja",
  "nav.setup": "Asetukset",
  "nav.language": "Kieli",
  "nav.main": "Päävalikko",

  "common.cancel": "Peruuta",
  "common.confirm": "Vahvista",
  "common.save": "Tallenna",
  "common.update": "Päivitä",
  "common.edit": "Muokkaa",
  "common.delete": "Poista",
  "common.deactivate": "Poista käytöstä",
  "common.loading": "Ladataan…",
  "common.inactive": "ei käytössä",
  "common.pts": "p",
  "common.selectMember": "Valitse jäsen",
  "common.selectReward": "Valitse palkinto",

  "today.anyone": "Kuka tahansa",
  "today.nothingScheduled": "Ei tehtäviä tänään",
  "today.rewards": "Palkinnot",
  "today.mostActive": "{{name}} aktiivisin",

  "week.title": "Tämä viikko",
  "week.task": "Tehtävä",
  "week.openTasks": "Avoimet tehtävät",
  "week.anyone": "Kuka tahansa",

  "setup.title": "Asetukset",
  "setup.tab.members": "Jäsenet",
  "setup.tab.tasks": "Tehtävät",
  "setup.tab.rewards": "Palkinnot",
  "setup.tab.backup": "Varmuuskopio",

  "members.add": "Lisää jäsen",
  "members.edit": "Muokkaa jäsentä",
  "members.name": "Nimi",
  "members.color": "Väri",
  "members.avatar": "Hahmo",
  "members.clearAvatar": "Poista hahmo",
  "members.listLabel": "Jäsenet",
  "members.deleteConfirm": "Poistetaanko {{name}}? Tätä ei voi perua.",

  "avatar.skinTone": "Ihonväri",
  "avatar.style": "Tyyli",
  "avatar.pets": "Lemmikit",
  "avatar.robots": "Robotit",
  "avatar.choose": "Valitse hahmo",

  "tasks.add": "Lisää tehtävä",
  "tasks.edit": "Muokkaa tehtävää",
  "tasks.title": "Otsikko",
  "tasks.icon": "Kuvake",
  "tasks.chooseIcon": "Valitse kuvake",
  "tasks.schedule": "Aikataulu",
  "tasks.schedule.daily": "Päivittäin",
  "tasks.schedule.weekdays": "Arkisin",
  "tasks.schedule.weekly": "Viikoittain",
  "tasks.schedule.once": "Kerran",
  "tasks.onTheseDays": "Näinä päivinä",
  "tasks.dayOfWeek": "Viikonpäivä",
  "tasks.date": "Päivämäärä",
  "tasks.assignment": "Kohdistus",
  "tasks.rotation": "Vuoro",
  "tasks.pool": "Yhteinen",
  "tasks.rotationOrder": "Vuorojärjestys",
  "tasks.points": "Pisteet",
  "tasks.deactivateConfirm":
    'Poistetaanko "{{title}}" käytöstä? Se ei enää näy taululla.',

  "rewards.add": "Lisää palkinto",
  "rewards.redeem": "Lunasta",
  "rewards.title": "Otsikko",
  "rewards.cost": "Hinta",
  "rewards.member": "Jäsen",
  "rewards.reward": "Palkinto",
  "rewards.selectBoth": "Valitse jäsen ja palkinto",
  "rewards.redeemConfirm":
    'Lunastetaanko "{{title}}" jäsenelle {{name}}? Maksaa {{cost}} p.',
  "rewards.deactivateConfirm":
    'Poistetaanko "{{title}}" käytöstä? Se ei enää näy palkintolistalla.',
  "rewards.row": "{{title}} — {{cost}} p",

  "backup.title": "Varmuuskopio",
  "backup.description":
    "Vie kotitalouden tiedot tiedostoon tai palauta aiemmasta varmuuskopiosta.",
  "backup.export": "Vie varmuuskopio",
  "backup.import": "Tuo varmuuskopio",
  "backup.loadSample": "Lataa Vuorio-perheen esimerkki",
  "backup.downloaded": "Varmuuskopio ladattu",
  "backup.importComplete": "Tuonti valmis",
  "backup.sampleLoaded": "Vuorio-perheen esimerkki ladattu",
  "backup.importConfirm": "Korvataanko kaikki tiedot? Tätä ei voi perua.",
  "backup.previewCounts":
    "Varmuuskopiossa on {{members}} jäsen(ä) ja {{tasks}} tehtävä(ä).",
  "backup.samplePreview":
    "Lataa Pasi, Minna, Sini, Saara, Miska sekä {{tasks}} kotityötä ja esimerkkipalkintoja.",

  "picker.whoDidIt": "Kuka teki?",

  "coach.title": "Valmentaja",
  "coach.subtitle": "Kysy kuka tekee mitä, ja kuka on tehnyt eniten.",
  "coach.ask": "Kysy",
  "coach.question": "Kysymys",
  "coach.planToday": "Tämän päivän suunnitelma",
  "coach.planTodayQuery": "Kuka tekee mitä tänään?",
  "coach.whoDidMost": "Kuka teki eniten?",
  "coach.whoDidMostQuery": "Kuka on tehnyt eniten?",
  "coach.today": "Tänään",
  "coach.thisWeek": "Tämä viikko",
  "coach.anyone": "Kuka tahansa",
  "coach.done": "tehty",
  "coach.open": "auki",
  "coach.thinking": "Mietitään…",
  "coach.unavailable": "Valmentaja ei ole käytettävissä. Käynnistä homework coach API.",

  "weekday.mon": "Ma",
  "weekday.tue": "Ti",
  "weekday.wed": "Ke",
  "weekday.thu": "To",
  "weekday.fri": "Pe",
  "weekday.sat": "La",
  "weekday.sun": "Su",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, fi };

export function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(params[key] ?? ""),
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template = messages[locale][key] ?? messages.en[key];
  return params ? interpolate(template, params) : template;
}

const DOMAIN_ERRORS: Record<string, Record<Locale, string>> = {
  "Name is required": {
    en: "Name is required",
    fi: "Nimi on pakollinen",
  },
  "Maximum 6 family members": {
    en: "Maximum 6 family members",
    fi: "Enintään 6 perheenjäsentä",
  },
  "Member not found": {
    en: "Member not found",
    fi: "Jäsentä ei löydy",
  },
  "Remove this member from all tasks first": {
    en: "Remove this member from all tasks first",
    fi: "Poista jäsen ensin kaikista tehtävistä",
  },
  "Member has completion records": {
    en: "Member has completion records",
    fi: "Jäsenellä on suoritusmerkintöjä",
  },
  "Title is required": {
    en: "Title is required",
    fi: "Otsikko on pakollinen",
  },
  "Title must be 30 characters or fewer": {
    en: "Title must be 30 characters or fewer",
    fi: "Otsikko saa olla enintään 30 merkkiä",
  },
  "Choose an icon": {
    en: "Choose an icon",
    fi: "Valitse kuvake",
  },
  "Rotation requires at least 2 members": {
    en: "Rotation requires at least 2 members",
    fi: "Vuoroon tarvitaan vähintään 2 jäsentä",
  },
  "Task not found": {
    en: "Task not found",
    fi: "Tehtävää ei löydy",
  },
  "Not a rotation task": {
    en: "Not a rotation task",
    fi: "Ei vuorotehtävä",
  },
  "Not a pool task": {
    en: "Not a pool task",
    fi: "Ei yhteistehtävä",
  },
  "Task not scheduled on this date": {
    en: "Task not scheduled on this date",
    fi: "Tehtävää ei ole tälle päivälle",
  },
  "Member is not assigned to this task": {
    en: "Member is not assigned to this task",
    fi: "Jäsen ei ole tehtävän vastuuhenkilö",
  },
  "Completion not found": {
    en: "Completion not found",
    fi: "Suoritusta ei löydy",
  },
  "Overrides apply to rotation tasks only": {
    en: "Overrides apply to rotation tasks only",
    fi: "Vaihdot koskevat vain vuorotehtäviä",
  },
  "Cost must be at least 1 point": {
    en: "Cost must be at least 1 point",
    fi: "Hinnan on oltava vähintään 1 piste",
  },
  "Reward not found": {
    en: "Reward not found",
    fi: "Palkintoa ei löydy",
  },
  "Not enough points": {
    en: "Not enough points",
    fi: "Ei tarpeeksi pisteitä",
  },
  "Invalid backup file": {
    en: "Invalid backup file",
    fi: "Virheellinen varmuuskopiotiedosto",
  },
};

export function translateError(error: string, locale: Locale): string {
  return DOMAIN_ERRORS[error]?.[locale] ?? error;
}

export function normalizeLocale(value: unknown): Locale {
  return value === "fi" ? "fi" : "en";
}
