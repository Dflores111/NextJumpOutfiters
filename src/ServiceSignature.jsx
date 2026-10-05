import React from 'react';

// Decorative shop cues share one stroke style and never replace the visible link label.
const glyphs = {
  suspension: <>
    <path d="M6 43h36" className="signature-ground"/>
    <circle cx="13" cy="37" r="4"/><circle cx="35" cy="37" r="4"/>
    <path className="signature-lift-spring" d="M18 35v-2l-3-2 6-2-6-2 3-2M30 35v-2l-3-2 6-2-6-2 3-2"/>
    <g className="signature-lift-body"><path d="M8 29v-8h6l5-7h10l6 7h5v8H8Z"/><path d="M17 21h15M24 14v7"/></g>
  </>,
  'bumpers-racks': <>
    <path className="signature-guard" d="M24 7c5 5 10 6 14 7v12c0 9-7 14-14 17-7-3-14-8-14-17V14c4-1 9-2 14-7Z"/>
    <path className="signature-clamp-left" d="M5 16v18h8"/><path className="signature-clamp-right" d="M43 16v18h-8"/>
    <path className="service-reveal signature-check" d="m17 25 5 5 10-12"/>
  </>,
  'wheels-tires': <>
    <g className="signature-wheel"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="12"/><circle cx="24" cy="24" r="3"/><path d="M24 12v9m0 6v9M12 24h9m6 0h9M16 16l6 6m4 4 6 6m-16 0 6-6m4-4 6-6"/><circle className="signature-tread" cx="24" cy="24" r="15"/></g>
  </>,
  power: <>
    <path className="service-reveal signature-current" d="M5 14h8M35 14h8M5 34h8M35 34h8"/>
    <path className="signature-bolt" d="m27 5-16 22h12l-2 16 16-22H25l2-16Z"/>
    <circle className="service-reveal signature-current" cx="5" cy="14" r="2"/><circle className="service-reveal signature-current" cx="43" cy="34" r="2"/>
  </>,
  lighting: <>
    <path className="signature-bulb" d="M15 22a9 9 0 1 1 18 0c0 5-5 6-5 12h-8c0-6-5-7-5-12Z"/>
    <path d="M20 38h8m-7 4h6"/>
    <g className="service-reveal signature-rays"><path d="M24 3v5M9 8l4 4M3 22h6M39 22h6M35 12l4-4"/></g>
  </>,
  'rooftop-tent': <>
    <path d="M5 40h38M9 40v4m30-4v4"/>
    <g className="signature-tent"><path d="m8 36 16-18 16 18H8Z"/><path d="m18 36 6-9 6 9"/><path d="m20 22 4-4 4 4"/></g>
    <path className="service-reveal signature-tent-support" d="M11 30v10m26-10v10"/>
  </>,
  camper: <>
    <path d="M7 32h33v5h-5m-22 0H7v-5Zm22 0v-9h6l6 8v6h-5"/><circle cx="16" cy="37" r="4"/><circle cx="35" cy="37" r="4"/>
    <g className="signature-camper"><path d="M9 10h26v9H25v9H9V10Z"/><path d="M14 15h6v6h-6Z"/></g>
    <path className="service-reveal signature-mount" d="m22 31 2 2 3-4"/>
  </>,
  detailing: <>
    <path className="signature-droplet" d="M19 9c0 7-9 10-9 19a9 9 0 0 0 18 0c0-9-9-12-9-19Z"/>
    <path className="signature-wipe" d="m9 38 28-25"/>
    <path className="service-reveal signature-sparkle" d="m35 8 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm0 23 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/>
  </>,
  'boat-detail': <>
    <path className="signature-hull" d="M8 25h33l-6 10H17L8 25Zm10 0V15h13l6 10M22 15v-5"/>
    <path className="signature-water" d="M5 40c4-4 7 4 11 0s7 4 11 0 7 4 11 0 5 1 5 1"/>
    <path className="service-reveal signature-boat-sparkle" d="m10 6 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z"/>
  </>,
  marine: <>
    <g className="signature-anchor"><circle cx="24" cy="10" r="4"/><path d="M24 14v25M9 26H5c0 8 8 13 19 13s19-5 19-13h-4M16 21h16"/></g>
    <path className="service-reveal signature-marine-water" d="M5 18c4-3 6 3 10 0s6 3 10 0 6 3 10 0 6 3 8 0"/>
  </>,
  trailer: <>
    <g className="signature-trailer"><path d="M6 31V14a5 5 0 0 1 5-5h19a5 5 0 0 1 5 5v17H23M13 31H6"/><path d="M20 31V15h9v16M6 16h9v8H6"/><g className="signature-trailer-wheel"><circle cx="18" cy="32" r="5"/><path d="M18 29v6m-3-3h6"/></g><path d="M35 30h7v-5"/></g>
    <path className="service-reveal signature-trailer-track" d="M5 41h9m5 0h6m5 0h4"/>
  </>
};

export function ServiceSignature({service}) {
  return <span className="service-icon" aria-hidden="true"><svg className="service-signature" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">{glyphs[service]}</svg></span>;
}
