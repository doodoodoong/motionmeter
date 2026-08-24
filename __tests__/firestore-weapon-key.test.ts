import {
  REFERENCE_WEAPON,
  WEAPON_QUERY_VALUE,
  normalizeWeaponId,
  type WeaponId,
} from '@/constants/physics';

describe('Firestore 무기 고정값', () => {
  it('기존 Firestore 문서와 호환되는 한글 리터럴을 유지한다', () => {
    expect(WEAPON_QUERY_VALUE.pyeongon).toBe('편곤');
    expect(WEAPON_QUERY_VALUE.staff).toBe('봉');
  });

  it.each(['pyeongon', 'staff'] as const)(
    '%s의 Firestore 고정값을 WeaponId로 왕복 변환한다',
    (weaponId: WeaponId) => {
      expect(normalizeWeaponId(WEAPON_QUERY_VALUE[weaponId])).toBe(weaponId);
    }
  );

  it.each([
    ['편곤', 'pyeongon'],
    ['봉', 'staff'],
    ['pyeongon', 'pyeongon'],
    ['staff', 'staff'],
    ['flail', 'pyeongon'],
  ] as const)('%s 별칭을 %s으로 정규화한다', (input, expected) => {
    expect(normalizeWeaponId(input)).toBe(expected);
  });

  it.each(['', 'unknown', 'Pyeongon', '검'])(
    '알 수 없는 값 %p은 기준 무기로 폴백한다',
    (input) => {
      expect(normalizeWeaponId(input)).toBe(REFERENCE_WEAPON);
    }
  );
});
