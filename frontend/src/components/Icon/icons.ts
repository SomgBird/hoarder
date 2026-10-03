// src/components/Icon/icons.ts
import back from '@/assets/icons/back.png';
import forward from '@/assets/icons/forward.png';
import refresh from '@/assets/icons/refresh.png';
import stop from '@/assets/icons/stop.png';

export const icons = {
  back,
  forward,
  refresh,
  stop,
} as const;

export type IconName = keyof typeof icons;