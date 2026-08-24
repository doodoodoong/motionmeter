import type { ko } from '@/locales/ko';

export type Language = 'ko' | 'en';
export type MessageKey = keyof typeof ko;
export type MessageCatalog = { [K in MessageKey]: string };
