/**
 * 무기의 언어 무관 화면 메타데이터.
 *
 * 물리 상수와 계산식은 전부 `constants/physics.ts`에 있다.
 * 이 파일에는 색상 키만 두며, 표시명은 번역 리소스에서 가져온다.
 * 물리 상수나 번역 문자열을 여기에 다시 정의하지 말 것.
 */
import { SIMPLE_COLORS } from '@/constants/theme';
import { type WeaponId } from '@/constants/physics';

export type { WeaponId };

export interface WeaponDisplay {
  /** 대표 색상 */
  color: string;
}

export const WEAPON_DISPLAY: Record<WeaponId, WeaponDisplay> = {
  pyeongon: {
    color: SIMPLE_COLORS.weapon.flail,
  },
  staff: {
    color: SIMPLE_COLORS.weapon.staff,
  },
};
