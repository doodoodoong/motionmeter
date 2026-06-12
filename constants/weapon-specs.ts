export interface WeaponSpec {
  name: string;
  factor: number;
}

export const WEAPON_SPECS: Record<'flail' | 'staff', WeaponSpec> = {
  flail: {
    name: '편곤',
    factor: 85.5,
  },
  staff: {
    name: '봉',
    factor: 28.5,
  },
};
