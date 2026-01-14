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
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  reminder_time: string;
  evening_time: string;
  monthly_time: string;
  is_admin: boolean;
  created_at: string;
};

export type Intention = {
  id: number;
  user_id: number;
  created_at: string;
} & EncryptedPayload;

export type IntentionConfig = Intention & {
  date: string | null;
};

export type Reflection = {
  id: number;
  user_id: number;
  date: string;
  intention_id: number | null;
  photo_file_ids: string[];
  created_at: string;
} & EncryptedPayload;
