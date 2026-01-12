export const CALLBACKS = {
  learnMore: "learn_more",
  freeTextYes: "free_text_yes",
  freeTextNo: "free_text_no",
  reflectYes: "REFLECT_YES",
  reflectNo: "REFLECT_NO",
} as const;

export const CALLBACK_PREFIX = {
  intentDate: "intent_date:",
  intentDone: "intent_done:",
  intentSelect: "intent_select:",
  intentAddDate: "intent_add_date:",
  intentEdit: "intent_edit:",
  intentDelete: "intent_delete:",
} as const;

export const CALLBACK_PATTERNS = {
  intentDate: new RegExp(`^${CALLBACK_PREFIX.intentDate}(\\d+)$`),
  intentDone: new RegExp(`^${CALLBACK_PREFIX.intentDone}(\\d+)$`),
  intentSelect: new RegExp(`^${CALLBACK_PREFIX.intentSelect}(\\d+)$`),
  intentAddDate: new RegExp(`^${CALLBACK_PREFIX.intentAddDate}(\\d+)$`),
  intentEdit: new RegExp(`^${CALLBACK_PREFIX.intentEdit}(\\d+)$`),
  intentDelete: new RegExp(`^${CALLBACK_PREFIX.intentDelete}(\\d+)$`),
} as const;

export const callbackData = {
  intentDate: (id: number) => `${CALLBACK_PREFIX.intentDate}${id}`,
  intentDone: (id: number) => `${CALLBACK_PREFIX.intentDone}${id}`,
  intentSelect: (id: number) => `${CALLBACK_PREFIX.intentSelect}${id}`,
  intentAddDate: (id: number) => `${CALLBACK_PREFIX.intentAddDate}${id}`,
  intentEdit: (id: number) => `${CALLBACK_PREFIX.intentEdit}${id}`,
  intentDelete: (id: number) => `${CALLBACK_PREFIX.intentDelete}${id}`,
} as const;
