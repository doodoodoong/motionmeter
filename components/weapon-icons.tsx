import React from "react";
import { SvgXml } from "react-native-svg";

const PYEONGON_XML = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="편곤 (조선시대 전통무기)">
  <title>편곤 Pyeongon</title>
  <defs>
    <linearGradient id="pgWood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6B4422"/>
      <stop offset="0.45" stop-color="#9C6531"/>
      <stop offset="1" stop-color="#6B4422"/>
    </linearGradient>
    <linearGradient id="pgIron" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2A2E34"/>
      <stop offset="0.5" stop-color="#5B636E"/>
      <stop offset="1" stop-color="#2A2E34"/>
    </linearGradient>
    <linearGradient id="pgCord" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5A2A20"/>
      <stop offset="0.5" stop-color="#9A4636"/>
      <stop offset="1" stop-color="#5A2A20"/>
    </linearGradient>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="76" fill="#EFE6D3"/>
  <rect x="16" y="16" width="480" height="480" rx="76" fill="none" stroke="#B89968" stroke-width="6"/>
  <rect x="34" y="34" width="444" height="444" rx="62" fill="none" stroke="#D8C49A" stroke-width="2"/>

  <g transform="rotate(28 256 256)">
    <rect x="240" y="200" width="32" height="244" rx="16" fill="url(#pgWood)"/>
    <rect x="248" y="208" width="6" height="228" rx="3" fill="#C68A4A" opacity="0.6"/>

    <rect x="236" y="356" width="40" height="84" rx="14" fill="url(#pgCord)"/>
    <g stroke="#3E1C14" stroke-width="3" stroke-linecap="round">
      <line x1="236" y1="368" x2="276" y2="378"/>
      <line x1="236" y1="384" x2="276" y2="394"/>
      <line x1="236" y1="400" x2="276" y2="410"/>
      <line x1="236" y1="416" x2="276" y2="426"/>
    </g>

    <rect x="232" y="436" width="48" height="20" rx="10" fill="url(#pgIron)"/>
    <rect x="233" y="190" width="46" height="18" rx="6" fill="url(#pgIron)"/>

    <circle cx="256" cy="178" r="13" fill="none" stroke="#5B636E" stroke-width="7"/>
    <circle cx="256" cy="156" r="13" fill="none" stroke="#3A3F47" stroke-width="7"/>

    <rect x="240" y="70" width="32" height="88" rx="16" fill="url(#pgWood)"/>
    <rect x="248" y="78" width="6" height="72" rx="3" fill="#C68A4A" opacity="0.6"/>

    <rect x="233" y="144" width="46" height="16" rx="6" fill="url(#pgIron)"/>
    <rect x="233" y="66" width="46" height="16" rx="6" fill="url(#pgIron)"/>

    <circle cx="256" cy="100" r="5.5" fill="#2A2E34"/>
    <circle cx="256" cy="124" r="5.5" fill="#2A2E34"/>
  </g>

  <text x="256" y="466" text-anchor="middle" font-family="'Nanum Myeongjo','Noto Serif KR',serif" font-size="34" font-weight="700" fill="#5A3A1E" letter-spacing="6">편곤</text>
</svg>`;

const BONG_XML = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="봉 (조선시대 전통무기)">
  <title>봉 Bong</title>
  <defs>
    <linearGradient id="bgWood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6B4422"/>
      <stop offset="0.45" stop-color="#9C6531"/>
      <stop offset="1" stop-color="#6B4422"/>
    </linearGradient>
    <linearGradient id="bgTip" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4A2E16"/>
      <stop offset="0.5" stop-color="#7A4E27"/>
      <stop offset="1" stop-color="#4A2E16"/>
    </linearGradient>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="76" fill="#EFE6D3"/>
  <rect x="16" y="16" width="480" height="480" rx="76" fill="none" stroke="#B89968" stroke-width="6"/>
  <rect x="34" y="34" width="444" height="444" rx="62" fill="none" stroke="#D8C49A" stroke-width="2"/>

  <g transform="rotate(38 256 256)">
    <rect x="242" y="60" width="30" height="392" rx="15" fill="url(#bgWood)"/>

    <rect x="250" y="70" width="6" height="372" rx="3" fill="#C68A4A" opacity="0.55"/>
    <g stroke="#6B4422" stroke-width="2" stroke-linecap="round" opacity="0.6">
      <line x1="246" y1="96" x2="246" y2="180"/>
      <line x1="266" y1="140" x2="266" y2="240"/>
      <line x1="248" y1="260" x2="248" y2="360"/>
      <line x1="265" y1="300" x2="265" y2="400"/>
    </g>

    <rect x="240" y="58" width="34" height="40" rx="14" fill="url(#bgTip)"/>
    <rect x="240" y="414" width="34" height="40" rx="14" fill="url(#bgTip)"/>

    <rect x="237" y="104" width="40" height="9" rx="4" fill="#4A2E16" opacity="0.8"/>
    <rect x="237" y="399" width="40" height="9" rx="4" fill="#4A2E16" opacity="0.8"/>
  </g>

  <text x="256" y="466" text-anchor="middle" font-family="'Nanum Myeongjo','Noto Serif KR',serif" font-size="34" font-weight="700" fill="#5A3A1E" letter-spacing="8">봉</text>
</svg>`;

type WeaponIconProps = {
  size?: number;
};

export function PyeongonIcon({ size = 56 }: WeaponIconProps) {
  return <SvgXml xml={PYEONGON_XML} width={size} height={size} />;
}

export function BongIcon({ size = 56 }: WeaponIconProps) {
  return <SvgXml xml={BONG_XML} width={size} height={size} />;
}

export function WeaponIcon({ weapon, size = 56 }: { weapon: "pyeongon" | "staff"; size?: number }) {
  return weapon === "pyeongon" ? <PyeongonIcon size={size} /> : <BongIcon size={size} />;
}
