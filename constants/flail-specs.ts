// 편곤 스펙 상수 정의
// 보병용, 마상용 편곤의 물리적 특성

export interface FlailSpec {
  name: string;
  bodyLength: number;    // 본체 길이 (m)
  headLength: number;    // 보조체 길이 (m)
  linkLength: number;    // 연결부 길이 (m)
  totalLength: number;   // 전체 길이 (m)
  mass: number;          // 총 질량 (kg)
}

export const FLAIL_SPECS: Record<'infantry' | 'cavalry', FlailSpec> = {
  infantry: {
    name: '보병용 편곤',
    bodyLength: 1.85,      // 185cm
    headLength: 0.47,      // 47cm
    linkLength: 0.055,     // 5.5cm
    totalLength: 2.375,    // 237.5cm (합계)
    mass: 1.9,             // 1.9kg
  },
  cavalry: {
    name: '마상용 편곤',
    bodyLength: 1.35,      // 135cm
    headLength: 0.33,      // 33cm
    linkLength: 0.035,     // 3.5cm
    totalLength: 1.715,    // 171.5cm (합계)
    mass: 1.1,             // 1.1kg
  },
};

// 편곤 타입
export type FlailType = 'infantry' | 'cavalry';

// 스펙 정보를 문자열로 반환하는 헬퍼 함수
export const getFlailSpecDescription = (type: FlailType): string => {
  const spec = FLAIL_SPECS[type];
  return `본체 ${spec.bodyLength * 100}cm / 보조체 ${spec.headLength * 100}cm / 연결부 ${spec.linkLength * 100}cm / 총질량 ${spec.mass}kg`;
};
