export const messages = {
  welcome: [
    "welcome",
    "a calm space for monthly intentions",
    "use /add to plan a few dates",
    "use /help to see everything",
  ].join("\n"),
  help: [
    "commands",
    "/add intention | 2025-03-05,2025-03-12",
    "/list",
    "/setreminder 09:00",
    "/setevening 20:30",
    "/reflect today your words",
  ].join("\n"),
  added: "intention saved",
  invalidAdd: [
    "please use",
    "/add intention | 2025-03-05,2025-03-12",
  ].join("\n"),
  invalidTime: "please use time like 09:00",
  reminderSet: (time: string) =>
    ["reminder time updated", time].join("\n"),
  eveningSet: (time: string) =>
    ["evening prompt updated", time].join("\n"),
  noIntentions: "no intentions yet",
  listHeader: "your intentions",
  reflectSaved: "reflection saved",
  reflectHelp: [
    "try",
    "/reflect today your words",
    "or send a photo with caption",
    "reflect today",
  ].join("\n"),
  reminder: (titles: string[]) =>
    ["gentle reminder", "for tomorrow", ...titles.map((t) => `- ${t}`)].join("\n"),
  eveningPrompt: (titles: string[]) =>
    [
      "evening check in",
      "today you planned",
      ...titles.map((t) => `- ${t}`),
      "if you like",
      "leave a short reflection or photo",
      "use /reflect today your words",
    ].join("\n"),
  monthlySummary: (intentions: number, plannedDates: number, reflections: number) =>
    [
      "month wrap",
      `intentions planned ${intentions}`,
      `dates held ${plannedDates}`,
      `reflections ${reflections}`,
      "thank you for showing up",
    ].join("\n"),
};
