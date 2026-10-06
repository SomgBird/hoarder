// src/components/Icon/icons.ts
import back from '@/assets/icons/back.png';
import forward from '@/assets/icons/forward.png';
import stop from '@/assets/icons/stop.png';
import star from '@/assets/icons/star.png';
import search from '@/assets/icons/search.png';
import printer from '@/assets/icons/printer.png';
import question_mark from  '@/assets/icons/question_mark.png';
import homepage_alt from '@/assets/icons/homepage_alt.png';
import refresh_page from '@/assets/icons/refresh_page.png';
import home from '@/assets/icons/home.png';


export const icons = {
  back,
  forward,
  stop,
  star,
  search,
  printer,
  question_mark,
  homepage_alt,
  refresh_page,
  home
} as const;

export type IconName = keyof typeof icons;