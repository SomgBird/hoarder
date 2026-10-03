// src/components/Icon/icons.ts
import back from '@/assets/icons/back.png';
import forward from '@/assets/icons/forward.png';
import refresh from '@/assets/icons/refresh.png';
import stop from '@/assets/icons/stop.png';
import star from '@/assets/icons/star.png';
import search from '@/assets/icons/search.png';
import printer from '@/assets/icons/printer.png';
import question_mark from  '@/assets/icons/question_mark.png';

export const icons = {
  back,
  forward,
  refresh,
  stop,
  star,
  search,
  printer,
  question_mark
} as const;

export type IconName = keyof typeof icons;