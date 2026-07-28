/**
 * 무기 표시(presentation) 정보.
 *
 * 물리 상수와 계산식은 전부 `constants/physics.ts`에 있다.
 * 이 파일에는 화면 표시용 이름·색상 키만 둔다. 물리 상수를 여기에
 * 다시 정의하지 말 것.
 */
import { SIMPLE_COLORS } from '@/constants/theme';
import { WEAPON_NAME, type WeaponId } from '@/constants/physics';

export type { WeaponId };

export interface WeaponDisplay {
  /** 표시명 */
  name: string;
  /** 대표 색상 */
  color: string;
}

export const WEAPON_DISPLAY: Record<WeaponId, WeaponDisplay> = {
  pyeongon: {
    name: WEAPON_NAME.pyeongon,
    color: SIMPLE_COLORS.weapon.flail,
  },
  staff: {
    name: WEAPON_NAME.staff,
    color: SIMPLE_COLORS.weapon.staff,
  },
};
