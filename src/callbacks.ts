export const CALLBACKS = {
  learnMore: "learn_more",
  freeTextYes: "free_text_yes",
  freeTextNo: "free_text_no",
  reflectYes: "REFLECT_YES",
  reflectNo: "REFLECT_NO",
  broadcastYes: "BROADCAST_YES",
  broadcastNo: "BROADCAST_NO",
  refreshMenu: "REFRESH_MENU",
} as const;

export const CALLBACK_PREFIX = {
  intentDate: "intent_date:",
  intentDone: "intent_done:",
  intentSelect: "intent_select:",
  intentAddDate: "intent_add_date:",
  intentEdit: "intent_edit:",
  intentDelete: "intent_delete:",
  reflectYes: "REFLECT_YES:",
} as const;

export const CALLBACK_PATTERNS = {
  intentDate: new RegExp(`^${CALLBACK_PREFIX.intentDate}(\\d+)$`),
  intentDone: new RegExp(`^${CALLBACK_PREFIX.intentDone}(\\d+)$`),
  intentSelect: new RegExp(`^${CALLBACK_PREFIX.intentSelect}(\\d+)$`),
  intentAddDate: new RegExp(`^${CALLBACK_PREFIX.intentAddDate}(\\d+)$`),
  intentEdit: new RegExp(`^${CALLBACK_PREFIX.intentEdit}(\\d+)$`),
  intentDelete: new RegExp(`^${CALLBACK_PREFIX.intentDelete}(\\d+)$`),
  reflectYes: new RegExp(`^${CALLBACK_PREFIX.reflectYes}(\\d+)$`),
} as const;

export const callbackData = {
  intentDate: (id: number) => `${CALLBACK_PREFIX.intentDate}${id}`,
  intentDone: (id: number) => `${CALLBACK_PREFIX.intentDone}${id}`,
  intentSelect: (id: number) => `${CALLBACK_PREFIX.intentSelect}${id}`,
  intentAddDate: (id: number) => `${CALLBACK_PREFIX.intentAddDate}${id}`,
  intentEdit: (id: number) => `${CALLBACK_PREFIX.intentEdit}${id}`,
  intentDelete: (id: number) => `${CALLBACK_PREFIX.intentDelete}${id}`,
  reflectYes: (id: number) => `${CALLBACK_PREFIX.reflectYes}${id}`,
} as const;
