export type Language = "en" | "uk";

export type EncryptedPayload = {
  ciphertext_b64: string;
  iv_b64: string;
  auth_tag_b64: string;
};

export type User = {
  id: number;
  telegram_id: number;
  language: Language;
  reminder_time: string;
  evening_time: string;
  monthly_time: string;
  created_at: string;
};

export type Category = {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
};

export type Intention = {
  id: number;
  user_id: number;
  category_id: number | null;
  created_at: string;
} & EncryptedPayload;

export type IntentionConfig = Intention & {
  date: string | null;
  category_name: string | null;
};

export type Feedback = {
  id: number;
  user_id: number;
  intention_id: number | null;
  date: string;
  photo_file_id: string | null;
  created_at: string;
} & EncryptedPayload;

export type Reflection = {
  id: number;
  user_id: number;
  date: string;
  photo_file_ids: string[];
  created_at: string;
} & EncryptedPayload;
