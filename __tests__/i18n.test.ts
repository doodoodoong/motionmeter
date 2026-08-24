import React from 'react';

import { en } from '@/locales/en';
import { ko } from '@/locales/ko';

const mockGetItem = jest.fn<Promise<string | null>, [string]>();
const mockSetItem = jest.fn<Promise<void>, [string, string]>();
const mockGetLocales = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: mockGetLocales,
}), { virtual: true });

const TestRenderer = require('react-test-renderer') as {
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: React.ReactElement) => { unmount: () => void };
};
const { I18nProvider, useI18n } = require('@/i18n') as typeof import('@/i18n');
type I18nValue = ReturnType<typeof useI18n>;

let currentI18n: I18nValue | null = null;

function Probe() {
  currentI18n = useI18n();
  return null;
}

async function renderProvider() {
  let renderer: ReturnType<typeof TestRenderer.create> | undefined;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(
      I18nProvider,
      null,
      React.createElement(Probe),
    ));
  });
  return renderer!;
}

describe('i18n', () => {
  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentI18n = null;
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockGetLocales.mockReturnValue([{ languageCode: 'ko' }]);
  });

  it('한국어와 영어 카탈로그의 키 집합이 완전히 일치한다', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ko).sort());
  });

  it('손상된 저장값은 기기 언어가 한국어일 때 한국어로 폴백한다', async () => {
    mockGetItem.mockResolvedValue('zz');
    const renderer = await renderProvider();

    expect(currentI18n).toMatchObject({ language: 'ko', hydrated: true });
    await TestRenderer.act(async () => renderer.unmount());
  });

  it('저장값이 없으면 기기 언어를 감지한다', async () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    const renderer = await renderProvider();

    expect(currentI18n).toMatchObject({ language: 'en', hydrated: true });
    await TestRenderer.act(async () => renderer.unmount());
  });

  it('이름 있는 자리표시자를 보간한다', async () => {
    const renderer = await renderProvider();

    expect(currentI18n!.t('rank.topPercent', { top: 7 })).toBe('상위 7%');
    expect(currentI18n!.t('home.measureWeapon', { weapon: '편곤' })).toBe('편곤 측정하기');
    await TestRenderer.act(async () => renderer.unmount());
  });

  it('없는 키를 받아도 예외 없이 키 문자열을 반환한다', async () => {
    const renderer = await renderProvider();

    expect(() => currentI18n!.t('missing.key' as never)).not.toThrow();
    expect(currentI18n!.t('missing.key' as never)).toBe('missing.key');
    await TestRenderer.act(async () => renderer.unmount());
  });
});
