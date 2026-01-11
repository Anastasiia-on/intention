export const CALLBACKS = {
  learnMore: "learn_more",
  feedbackWrite: "feedback_write",
  feedbackPhoto: "feedback_photo",
  feedbackSkip: "feedback_skip",
  catAdd: "cat_add",
  catBack: "cat_back",
  startNewMonth: "start_new_month",
  freeTextYes: "free_text_yes",
  freeTextNo: "free_text_no",
  reflectYes: "REFLECT_YES",
  reflectNo: "REFLECT_NO",
} as const;

export const CALLBACK_PREFIX = {
  intentDate: "intent_date:",
  intentCat: "intent_cat:",
  intentDone: "intent_done:",
  intentSelect: "intent_select:",
  intentAddDate: "intent_add_date:",
  intentEdit: "intent_edit:",
  intentDelete: "intent_delete:",
  catPick: "cat_pick:",
  catNew: "cat_new:",
  catShow: "cat_show:",
  catAddIntention: "cat_add_intention:",
} as const;

export const CALLBACK_PATTERNS = {
  intentDate: new RegExp(`^${CALLBACK_PREFIX.intentDate}(\\d+)$`),
  intentCat: new RegExp(`^${CALLBACK_PREFIX.intentCat}(\\d+)$`),
  intentDone: new RegExp(`^${CALLBACK_PREFIX.intentDone}(\\d+)$`),
  intentSelect: new RegExp(`^${CALLBACK_PREFIX.intentSelect}(\\d+)$`),
  intentAddDate: new RegExp(`^${CALLBACK_PREFIX.intentAddDate}(\\d+)$`),
  intentEdit: new RegExp(`^${CALLBACK_PREFIX.intentEdit}(\\d+)$`),
  intentDelete: new RegExp(`^${CALLBACK_PREFIX.intentDelete}(\\d+)$`),
  catPick: new RegExp(`^${CALLBACK_PREFIX.catPick}(\\d+):(\\d+)$`),
  catNew: new RegExp(`^${CALLBACK_PREFIX.catNew}(\\d+)$`),
  catShow: new RegExp(`^${CALLBACK_PREFIX.catShow}(\\d+)$`),
  catAddIntention: new RegExp(`^${CALLBACK_PREFIX.catAddIntention}(\\d+)$`),
} as const;

export const callbackData = {
  intentDate: (id: number) => `${CALLBACK_PREFIX.intentDate}${id}`,
  intentCat: (id: number) => `${CALLBACK_PREFIX.intentCat}${id}`,
  intentDone: (id: number) => `${CALLBACK_PREFIX.intentDone}${id}`,
  intentSelect: (id: number) => `${CALLBACK_PREFIX.intentSelect}${id}`,
  intentAddDate: (id: number) => `${CALLBACK_PREFIX.intentAddDate}${id}`,
  intentEdit: (id: number) => `${CALLBACK_PREFIX.intentEdit}${id}`,
  intentDelete: (id: number) => `${CALLBACK_PREFIX.intentDelete}${id}`,
  catPick: (intentionId: number, categoryId: number) =>
    `${CALLBACK_PREFIX.catPick}${intentionId}:${categoryId}`,
  catNew: (intentionId: number) => `${CALLBACK_PREFIX.catNew}${intentionId}`,
  catShow: (categoryId: number) => `${CALLBACK_PREFIX.catShow}${categoryId}`,
  catAddIntention: (categoryId: number) => `${CALLBACK_PREFIX.catAddIntention}${categoryId}`,
} as const;
