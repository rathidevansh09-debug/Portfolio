// Content contract (ARCHITECTURE §4; PRD §11; AGENTS §5, §8).
// TypeScript enforces every rule a type can express (required alt text, captions for speech,
// exactly six facts fields, tags limited to the approved filter keys). `npm run build` type-checks
// first, so a content mistake stops the build. Rules a type cannot express are checked at runtime
// by validate.ts (unit tests + launch check).

import type { OrPending } from './pending.ts';

// ── Copy status (PRD D-02) ────────────────────────────────────────────────────────────
/** Wording with its approval status. Only text marked [DRAFT COPY] in PRD/DESIGN is `draft`. */
export interface Copy {
  readonly text: string;
  readonly status: 'draft' | 'approved';
}

export const draft = (text: string): Copy => ({ text, status: 'draft' });
export const approved = (text: string): Copy => ({ text, status: 'approved' });

// ── Media (ARCHITECTURE §4.3, §8; AGENTS §15) ────────────────────────────────────────
/**
 * Output of a vite-imagetools `?as=picture` import from src/assets/ (mirrors imagetools-core's
 * `Picture`): one srcset per generated format (AVIF/WebP) plus the fallback image and its size,
 * which reserves layout space (ARCHITECTURE §8.1). Importing makes a missing file fail the build.
 */
export interface PictureAsset {
  readonly sources: Readonly<Record<string, string>>;
  readonly img: { readonly src: string; readonly w: number; readonly h: number };
}

/** An SVG imported by URL (imagetools does not process SVG): logos, toolkit icons. */
export interface SvgAsset {
  readonly format: 'svg';
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export type ImageAsset = PictureAsset | SvgAsset;

/** Width and height of any image asset (for reserved space and aspect-ratio checks). */
export function assetSize(asset: ImageAsset): { width: number; height: number } {
  return 'img' in asset
    ? { width: asset.img.w, height: asset.img.h }
    : { width: asset.width, height: asset.height };
}

/**
 * An image with its alt text. Alt text is required; decorative images set `decorative: true`
 * with an empty alt.
 */
export type ImageRef =
  | {
      readonly kind: 'image';
      readonly asset: ImageAsset;
      readonly alt: string;
      readonly caption?: string;
      readonly decorative?: false;
    }
  | {
      readonly kind: 'image';
      readonly asset: ImageAsset;
      readonly alt: '';
      readonly caption?: string;
      readonly decorative: true;
    };

/**
 * A pre-sized image served unchanged from public/: video posters (owner decision, Phase 3) and
 * the share image (ARCHITECTURE §2.2). `src` is the public URL path, e.g. /media/video/x.jpg.
 */
export interface PublicImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export interface DocumentRef {
  readonly kind: 'document';
  /** Path under public/documents/. */
  readonly href: string;
  /** Image preview shown in the pop-up (ARCHITECTURE A-6). */
  readonly preview: ImageRef;
  readonly label: string;
}

/** Caption/subtitle file for a local video, e.g. WebVTT in public/media/video/ (A-10). */
export interface CaptionsFile {
  readonly src: string;
  readonly lang: string;
}

interface VideoBase {
  readonly kind: 'video';
  /** Pre-sized local poster in public/media/video/; never fetched from YouTube/Vimeo (§8.2). */
  readonly poster: PublicImage;
  /** Accessible name for the player. */
  readonly title: string;
}

/** Short clip served from public/media/video/ (D-07). Speech requires a captions file (A-10). */
export type LocalVideo = VideoBase & {
  readonly source: { readonly type: 'local'; readonly src: string };
} & (
    | { readonly hasSpeech: false; readonly captionsFile?: CaptionsFile }
    | { readonly hasSpeech: true; readonly captionsFile: CaptionsFile }
  );

/** Long video embedded from YouTube/Vimeo (D-07, A-5). Speech requires confirmed platform captions. */
export type EmbedVideo = VideoBase & {
  readonly source: { readonly type: 'youtube' | 'vimeo'; readonly url: string };
} & (
    | { readonly hasSpeech: false; readonly platformCaptionsConfirmed?: boolean }
    | { readonly hasSpeech: true; readonly platformCaptionsConfirmed: true }
  );

export type Video = LocalVideo | EmbedVideo;

/**
 * Before and after images of the same screen (FR-BD4). One shape serves the Breakdown section
 * (before = wireframe, after = final design) and before/after media in the pop-up, so a single
 * ComparisonSlider renders both (ARCHITECTURE §3.3). Differing aspect ratios are fitted without
 * distortion (§8.1); the launch check reports them.
 */
export interface BeforeAfter {
  readonly kind: 'beforeAfter';
  readonly before: ImageRef;
  readonly after: ImageRef;
}

export type HeroMedia = ImageRef | Video | BeforeAfter;

export interface Link {
  readonly href: string;
  readonly label: Copy;
}

// ── Filters (D-03) ────────────────────────────────────────────────────────────────────
/** The six approved filter tags. "All" is not a tag. Shopify is never a filter (D-03). */
export const FILTER_KEYS = [
  'product-saas',
  'dashboards-data',
  'ecommerce',
  'design-systems',
  'motion-video',
  'visual-design',
] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export interface Filter {
  readonly key: FilterKey;
  readonly label: string;
}

// ── Projects (ARCHITECTURE §4.3) ─────────────────────────────────────────────────────
export type ProjectType = 'case-study' | 'website' | 'video-motion' | 'before-after';

/** A fact is shown only if present and verified (D-20). */
export interface Fact {
  readonly value: string;
  readonly verified: boolean;
}

/** Exactly six possible facts (D-22). My Role appears only here (D-21). Tags are not facts. */
export interface Facts {
  readonly client?: Fact;
  readonly year?: Fact;
  readonly myRole?: Fact;
  readonly team?: Fact;
  readonly platform?: Fact;
  readonly tools?: Fact;
}

export const FACT_KEYS = ['client', 'year', 'myRole', 'team', 'platform', 'tools'] as const;

export type ContentItem =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'bullets'; readonly items: readonly string[] }
  | ImageRef
  | Video
  | BeforeAfter;

export interface CaseStudySection {
  /** Optional sub-title (DESIGN §8.10). */
  readonly heading?: string;
  readonly items: readonly ContentItem[];
}

/** Outcomes appear only when verified (FR-M4). */
export interface Outcome {
  readonly value?: string;
  readonly label: string;
  readonly verified: boolean;
}

/** Six sections in fixed order; empty ones are hidden (D-16). */
export interface CaseStudySections {
  readonly overview?: CaseStudySection;
  readonly problem?: CaseStudySection;
  readonly research?: CaseStudySection;
  readonly processAndDecisions?: CaseStudySection;
  readonly finalDesigns?: CaseStudySection;
  readonly outcomes?: readonly Outcome[];
}

export const SECTION_ORDER = [
  'overview',
  'problem',
  'research',
  'processAndDecisions',
  'finalDesigns',
  'outcomes',
] as const;

export interface Project {
  readonly slug: string;
  readonly title: string;
  readonly client: OrPending<string | null>;
  /** One or more approved filter keys; at least one before launch. */
  readonly tags: OrPending<readonly FilterKey[]>;
  readonly primaryCategory: OrPending<string>;
  readonly type: OrPending<ProjectType>;
  readonly year: OrPending<number>;
  readonly cover: OrPending<ImageRef>;
  readonly heroMedia: OrPending<HeroMedia>;
  readonly summary: OrPending<string>;
  readonly facts: OrPending<Facts>;
  /** null = the project has no external link. */
  readonly externalLink: OrPending<Link | null>;
  readonly sections: OrPending<CaseStudySections>;
  /** Published only when the owner confirms permission to show it (PRD A-10). */
  readonly permissionConfirmed: OrPending<boolean>;
}

export interface ProjectIndex {
  /** Full display order (FR-W9: PENDING). */
  readonly displayOrder: OrPending<readonly string[]>;
  /** Featured projects, in order (DS-4: confirmed). */
  readonly featured: readonly string[];
}

// ── Brands (D-12) ─────────────────────────────────────────────────────────────────────
export interface Brand {
  readonly name: string;
  readonly logo: ImageRef;
  readonly permissionConfirmed: boolean;
}

// ── Impact & milestones (FR-I1–I5, D-23) ─────────────────────────────────────────────
export type EmptyPanelDecision = 'hide' | 'add-content-before-launch';

export interface Milestone {
  readonly title: string;
  readonly context: string;
  readonly year: number;
  readonly media?: ImageRef | DocumentRef;
  readonly verified: boolean;
}

export interface HighlightFigure {
  readonly value: string;
  readonly suffix?: string;
  readonly label: string;
  readonly verified: boolean;
}

export interface ImpactContent {
  readonly paragraph: OrPending<string>;
  readonly proofLink: OrPending<Link | null>;
  /** null = no highlight figure (never filled with an unverified number). */
  readonly highlight: OrPending<HighlightFigure | null>;
  readonly milestones: OrPending<readonly Milestone[]>;
  /** Owner decision for the zero-verified-items case (FR-I4). */
  readonly zeroItemsDecision: OrPending<EmptyPanelDecision>;
}

// ── Breakdown (FR-BD1–BD4, D-09) ─────────────────────────────────────────────────────
export interface BreakdownContent {
  /** Project slug, or a description of a standalone pair. D-09: not selected yet. */
  readonly project: OrPending<string>;
  readonly pair: OrPending<BeforeAfter>;
  readonly credit: OrPending<string>;
  readonly paragraph: OrPending<string>;
}

// ── About (FR-A1–A2) ─────────────────────────────────────────────────────────────────
export interface EducationRow {
  readonly institution: string;
  readonly programme: string;
  readonly year: string;
  readonly description: string;
}

export interface ToolkitItem {
  readonly name: string;
  readonly icon: ImageRef;
}

export interface ProcessStep {
  readonly number: string;
  /** Titles confirmed (D-13). */
  readonly title: string;
  readonly description: OrPending<string>;
}

export interface AboutContent {
  readonly intro: OrPending<string>;
  readonly education: OrPending<readonly EducationRow[]>;
  readonly courses: OrPending<readonly EducationRow[]>;
  readonly primarySkills: readonly string[];
  readonly supportingSkills: readonly string[];
  readonly toolkit: OrPending<readonly ToolkitItem[]>;
  readonly processSteps: readonly ProcessStep[];
  readonly quote: OrPending<string>;
  readonly signature: string;
}

// ── Journey (FR-J1–J5, D-10, D-15) ───────────────────────────────────────────────────
export interface YearMonth {
  readonly year: number;
  readonly month?: number;
}

export interface Role {
  /** Stable id used by `promotedFrom`. */
  readonly id: string;
  readonly role: OrPending<string>;
  readonly company: OrPending<string>;
  readonly start: OrPending<YearMonth>;
  readonly end: OrPending<YearMonth | 'present'>;
  readonly description: OrPending<string>;
  /** Id of the previous role at the same company; drives the ↑ PROMOTED marker (D-15). */
  readonly promotedFrom?: string;
}

export interface JourneyMilestone {
  readonly title: string;
  readonly year: number;
  /** Opens in the pop-up: image, or document preview + "Open document" (A-6). */
  readonly opens: ImageRef | DocumentRef;
  readonly verified: boolean;
}

export interface ExperienceContent {
  /** Newest first (D-10). */
  readonly roles: readonly Role[];
  readonly milestones: OrPending<readonly JourneyMilestone[]>;
  /** Owner decision when no verified milestones exist (FR-J5). */
  readonly emptyPanelDecision: OrPending<EmptyPanelDecision>;
}

// ── Profile / hero (FR-HE1–HE8) ──────────────────────────────────────────────────────
export interface Stat {
  readonly value: string;
  readonly suffix?: string;
  readonly label: string;
  readonly link?: Link;
  readonly verified: boolean;
}

export interface ProfileContent {
  readonly displayName: string;
  readonly wordmark: string;
  readonly heroName: string;
  readonly heroWord: string;
  readonly topStripRole: string;
  readonly supportingLine: Copy;
  readonly helloLine: Copy;
  readonly roleLines: readonly [string, string];
  readonly intro: OrPending<string>;
  readonly location: OrPending<string>;
  readonly availability: { readonly text: Copy; readonly shown: OrPending<boolean> };
  readonly manifestoLines: readonly Copy[];
  /** 0–3 verified figures; fewer are shown if fewer are verified (FR-HE6). */
  readonly stats: OrPending<readonly Stat[]>;
  readonly cv: OrPending<DocumentRef>;
  /** null = no showreel; "Play showreel" then opens the first featured project (A-7). */
  readonly showreel: OrPending<Video | null>;
  readonly editionStartYear: OrPending<number>;
  /** Single source for social links; Contact (FR-C2) and the footer (FR-F1) both read these. */
  readonly socialLinks: {
    readonly linkedin: OrPending<string>;
    /** Optional Behance / Dribbble / Instagram; empty array = none. */
    readonly others: OrPending<readonly SocialLink[]>;
  };
}

// ── Contact (FR-C1–C6) ───────────────────────────────────────────────────────────────
export interface SocialLink {
  readonly network: string;
  readonly href: string;
}

export interface MessageTemplates {
  readonly whatsapp: string;
  readonly emailSubject: string;
  readonly emailBody: string;
}

export interface ContactContent {
  /** Confirmed (D-18). */
  readonly closingStatement: string;
  readonly email: OrPending<string>;
  /** International format, digits only, e.g. country code + number. */
  readonly whatsapp: OrPending<string>;
  // LinkedIn and other social links are profile.socialLinks (ARCHITECTURE §4.2); the Contact
  // section lists them with these channels, so the data exists once.
  readonly basedIn: OrPending<string>;
  readonly projectTypes: readonly Copy[];
  readonly messageTemplates: OrPending<MessageTemplates>;
}

// ── Site metadata (FR-G5, FR-G6, D-11) ───────────────────────────────────────────────
export interface SiteContent {
  readonly title: Copy;
  readonly description: Copy;
  /** public/og-image.jpg (1200 × 630), served unchanged (ARCHITECTURE §2.2). */
  readonly shareImage: OrPending<PublicImage>;
  /** Exactly what the share image says; scanned by the launch check (ARCHITECTURE §4.7). */
  readonly shareImageWording: OrPending<string>;
  readonly favicon: { readonly monogram: string };
  /** Full name for author metadata and JSON-LD only — never visitor-facing (D-11). */
  readonly fullNameForMetadata: string;
  readonly noscriptText: string;
}

// ── UI copy (D-02) ───────────────────────────────────────────────────────────────────
export type UiCopy = {
  readonly [group: string]: { readonly [key: string]: OrPending<Copy> };
};

// ── Everything ───────────────────────────────────────────────────────────────────────
export interface PortfolioContent {
  readonly site: SiteContent;
  readonly ui: UiCopy;
  readonly profile: ProfileContent;
  readonly projects: readonly Project[];
  readonly projectIndex: ProjectIndex;
  readonly filters: readonly Filter[];
  readonly brands: OrPending<readonly Brand[]>;
  readonly impact: ImpactContent;
  readonly breakdown: BreakdownContent;
  readonly about: AboutContent;
  readonly experience: ExperienceContent;
  readonly contact: ContactContent;
}
