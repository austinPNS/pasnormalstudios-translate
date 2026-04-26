import type { CSSProperties, ReactNode } from 'react';

type IcProps = {
  size?: number;
  sw?: number;
  stroke?: string;
  fill?: string;
  style?: CSSProperties;
  viewBox?: string;
  children?: ReactNode;
  d?: string;
};

export const Ic = ({
  d,
  size = 16,
  fill,
  stroke = 'currentColor',
  sw = 1.5,
  children,
  style,
  viewBox = '0 0 16 16',
}: IcProps) => (
  <svg
    className="ico"
    width={size}
    height={size}
    viewBox={viewBox}
    fill={fill || 'none'}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

type P = Omit<IcProps, 'd' | 'children'>;

export const IcDocs = (p: P) => (
  <Ic {...p}>
    <path d="M3 2.5h7l3 3V13a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 3 13V3a.5.5 0 0 1 .5-.5Z" />
    <path d="M10 2.5V5.5h3" />
  </Ic>
);
export const IcViewer = (p: P) => (
  <Ic {...p}>
    <rect x="2" y="3" width="12" height="10" rx="1" />
    <path d="M8 3v10" />
  </Ic>
);
export const IcBulk = (p: P) => (
  <Ic {...p}>
    <rect x="2.5" y="2.5" width="5" height="5" rx="1" />
    <rect x="8.5" y="2.5" width="5" height="5" rx="1" />
    <rect x="2.5" y="8.5" width="5" height="5" rx="1" />
    <rect x="8.5" y="8.5" width="5" height="5" rx="1" />
  </Ic>
);
export const IcPrompt = (p: P) => (
  <Ic {...p}>
    <path d="M3 13V3.5A.5.5 0 0 1 3.5 3h9a.5.5 0 0 1 .5.5V10l-3 3H3.5a.5.5 0 0 1-.5-.5Z" />
    <path d="M10 10h3M10 13v-3" />
    <path d="M6 6.5h4M6 8.5h3" />
  </Ic>
);
export const IcTranslate = (p: P) => (
  <Ic {...p}>
    <path d="M3 4.5h7" />
    <path d="M6.5 4.5c0 3-1.7 5.3-4 6.7" />
    <path d="M4.5 8.5c.8.8 1.8 1.5 3 2" />
    <path d="M10 6.5h3" />
    <path d="M11.5 5v1.5" />
    <path d="m9.5 12 2-5 2 5" />
    <path d="M10.2 10.2h2.6" />
  </Ic>
);
export const IcJobs = (p: P) => (
  <Ic {...p}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3l2 1.5" />
  </Ic>
);
export const IcGlossary = (p: P) => (
  <Ic {...p}>
    <path d="M4 2.5h7.5A1.5 1.5 0 0 1 13 4v9.5H5.5A1.5 1.5 0 0 1 4 12V2.5Z" />
    <path d="M4 12a1.5 1.5 0 0 0 1.5 1.5h7.5" />
    <path d="M6.5 5.5h4" />
  </Ic>
);
export const IcSettings = (p: P) => (
  <Ic {...p}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13" />
  </Ic>
);
export const IcSearch = (p: P) => (
  <Ic {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5 14 14" />
  </Ic>
);
export const IcPlus = (p: P) => (
  <Ic {...p}>
    <path d="M8 3.5v9M3.5 8h9" />
  </Ic>
);
export const IcFilter = (p: P) => (
  <Ic {...p}>
    <path d="M2.5 4h11M5 8h6M7 12h2" />
  </Ic>
);
export const IcChevron = (p: P) => (
  <Ic {...p}>
    <path d="M6 4l4 4-4 4" />
  </Ic>
);
export const IcDown = (p: P) => (
  <Ic {...p}>
    <path d="M4 6l4 4 4-4" />
  </Ic>
);
export const IcCheck = (p: P) => (
  <Ic {...p}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </Ic>
);
export const IcMore = (p: P) => (
  <Ic {...p}>
    <circle cx="3.5" cy="8" r=".75" fill="currentColor" />
    <circle cx="8" cy="8" r=".75" fill="currentColor" />
    <circle cx="12.5" cy="8" r=".75" fill="currentColor" />
  </Ic>
);
export const IcX = (p: P) => (
  <Ic {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Ic>
);
export const IcPlay = (p: P) => (
  <Ic {...p}>
    <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" stroke="none" />
  </Ic>
);
export const IcSync = (p: P) => (
  <Ic {...p}>
    <path d="M3 8a5 5 0 0 1 8.5-3.5L13 6" />
    <path d="M13 3v3h-3" />
    <path d="M13 8a5 5 0 0 1-8.5 3.5L3 10" />
    <path d="M3 13v-3h3" />
  </Ic>
);
export const IcOpen = (p: P) => (
  <Ic {...p}>
    <path d="M6 3H3v10h10v-3" />
    <path d="M9 3h4v4" />
    <path d="M7 9l6-6" />
  </Ic>
);
export const IcProduct = (p: P) => (
  <Ic {...p}>
    <path d="M3 5l5-2.5L13 5v6l-5 2.5L3 11V5Z" />
    <path d="M3 5l5 2.5M13 5l-5 2.5M8 7.5V13" />
  </Ic>
);
export const IcCollection = (p: P) => (
  <Ic {...p}>
    <rect x="2.5" y="4.5" width="11" height="8" rx="1" />
    <path d="M4 4.5V3h8v1.5" />
  </Ic>
);
export const IcCategory = (p: P) => (
  <Ic {...p}>
    <path d="M3 4h10M3 8h10M3 12h10" />
  </Ic>
);
export const IcFeature = (p: P) => (
  <Ic {...p}>
    <path d="M8 2l1.6 3.4 3.9.4-3 2.6.9 3.9L8 10.5l-3.4 1.8.9-3.9-3-2.6 3.9-.4L8 2Z" />
  </Ic>
);
export const IcFrontpage = (p: P) => (
  <Ic {...p}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
    <path d="M2.5 6.5h11M6 6.5V13" />
  </Ic>
);
export const IcBlock = (p: P) => (
  <Ic {...p}>
    <rect x="2.5" y="2.5" width="11" height="4" rx="1" />
    <rect x="2.5" y="8.5" width="5" height="5" rx="1" />
    <rect x="8.5" y="8.5" width="5" height="5" rx="1" />
  </Ic>
);
export const IcSliders = (p: P) => (
  <Ic {...p}>
    <path d="M3 4h10M3 8h10M3 12h10" />
    <circle cx="6" cy="4" r="1.5" fill="var(--bg)" />
    <circle cx="10" cy="8" r="1.5" fill="var(--bg)" />
    <circle cx="5" cy="12" r="1.5" fill="var(--bg)" />
  </Ic>
);
export const IcArrow = (p: P) => (
  <Ic {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Ic>
);
export const IcHistory = (p: P) => (
  <Ic {...p}>
    <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9" />
    <path d="M2.5 3v3h3" />
    <path d="M8 5v3.5l2.2 1.3" />
  </Ic>
);

export const DOC_ICONS: Record<string, (p: P) => JSX.Element> = {
  product: IcProduct,
  collection: IcCollection,
  category: IcCategory,
  feature: IcFeature,
  frontpage: IcFrontpage,
  hero: IcFrontpage,
  block: IcBlock,
};
