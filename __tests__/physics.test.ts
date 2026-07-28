import fs from 'fs';
import path from 'path';

import {
  COEFF_VERSION,
  EQUIVALENT_MASS,
  INERTIA,
  L_TOT,
  STRIKE_COEFFICIENT,
  TOTAL_MASS,
  compute,
} from '@/constants/physics';

describe('물리 상수', () => {
  it('전체 길이와 총질량이 제원과 일치한다', () => {
    expect(L_TOT).toBeCloseTo(2.375, 3);
    expect(TOTAL_MASS).toBeCloseTo(2.0, 3);
  });

  it('등가질량 m_eq = I / L_TOT²', () => {
    expect(EQUIVALENT_MASS.staff).toBeCloseTo(0.667, 3);
    expect(EQUIVALENT_MASS.pyeongon).toBeCloseTo(1.045, 3);
  });

  it('상대 타격계수 C = (I / I_봉) × k²', () => {
    expect(STRIKE_COEFFICIENT.staff).toBeCloseTo(1.0, 3);
    expect(STRIKE_COEFFICIENT.pyeongon).toBeCloseTo(2.65, 2);
  });

  it('계수 버전이 기록되어 있다', () => {
    expect(COEFF_VERSION).toBe('v2-2026-07');
  });
});

describe('compute()', () => {
  it('봉을 10 rad/s로 휘두르면 지수가 정확히 100이다', () => {
    expect(compute('staff', 10).index).toBeCloseTo(100, 2);
  });

  it('편곤을 10 rad/s로 휘두르면 지수가 약 265다', () => {
    expect(compute('pyeongon', 10).index).toBeCloseTo(265, 0);
  });

  it('지수의 비와 등가 운동에너지의 비가 일치한다 (약 2.65)', () => {
    const staff = compute('staff', 10);
    const pyeongon = compute('pyeongon', 10);

    const indexRatio = pyeongon.index / staff.index;
    const energyRatio = pyeongon.energy / staff.energy;

    expect(indexRatio).toBeCloseTo(energyRatio, 6);
    expect(indexRatio).toBeCloseTo(2.65, 2);
  });

  it('봉은 k=1이므로 energy가 ½·I_봉·ω²와 일치한다 (ω=10에서 188.0 J)', () => {
    const { energy } = compute('staff', 10);

    expect(energy).toBeCloseTo(0.5 * INERTIA.staff * 10 ** 2, 6);
    expect(energy).toBeCloseTo(188.0, 1);
  });

  it('편곤 ω=10에서 energy ≈ 498.1 J, tipSpeed ≈ 30.9 m/s', () => {
    const { energy, tipSpeed } = compute('pyeongon', 10);

    expect(energy).toBeCloseTo(498.1, 0);
    expect(tipSpeed).toBeCloseTo(30.9, 1);
  });

  it('omega가 0이면 모든 산출값이 0이다', () => {
    for (const weapon of ['staff', 'pyeongon'] as const) {
      expect(compute(weapon, 0)).toEqual({
        omega: 0,
        tipSpeed: 0,
        energy: 0,
        index: 0,
      });
    }
  });

  it('flail 별칭도 편곤으로 처리한다 (과거 데이터 호환)', () => {
    expect(compute('flail', 10)).toEqual(compute('pyeongon', 10));
    expect(compute('편곤', 10)).toEqual(compute('pyeongon', 10));
    expect(compute('봉', 10)).toEqual(compute('staff', 10));
  });
});

describe('절대 힘 산출 코드 제거 확인', () => {
  const SOURCE_DIRS = ['app', 'components', 'constants', 'hooks', 'styles', 'utils', 'scripts'];
  const FORBIDDEN = [/impactForce/, /충격력/, /뉴턴/];

  const collectSourceFiles = (dir: string): string[] => {
    const root = path.join(process.cwd(), dir);
    if (!fs.existsSync(root)) return [];

    return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(root, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(path.join(dir, entry.name));
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) return [full];
      return [];
    });
  };

  it('소스 전체에 impactForce 계산 로직이 남아 있지 않다', () => {
    const offenders: string[] = [];

    for (const dir of SOURCE_DIRS) {
      for (const file of collectSourceFiles(dir)) {
        const source = fs.readFileSync(file, 'utf8');
        for (const pattern of FORBIDDEN) {
          if (pattern.test(source)) {
            offenders.push(`${path.relative(process.cwd(), file)} :: ${pattern}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
