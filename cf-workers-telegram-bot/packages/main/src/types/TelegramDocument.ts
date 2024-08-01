import TelegramPhotoSize from "./TelegramPhotoSize.js";

export interface TelegramDocument {
  file_name: string;
  mime_type: string;
  thumbnail: TelegramPhotoSize;
  file_id: string;
  file_unique_id: string;
  file_size: number;
}
