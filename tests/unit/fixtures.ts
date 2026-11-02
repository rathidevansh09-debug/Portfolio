// Test fixtures: clearly fictional data used only by unit tests (never site content).

import { content } from '../../src/content/index.ts';
import type {
  ImageRef,
  PictureAsset,
  PortfolioContent,
  Project,
  ProjectIndex,
  PublicImage,
} from '../../src/content/schema.ts';

export const picture = (w = 100, h = 60, src = '/test.png'): PictureAsset => ({
  sources: { avif: `/test.avif ${w}w`, webp: `/test.webp ${w}w` },
  img: { src, w, h },
});

export const image = (alt = 'Test image', asset: PictureAsset = picture()): ImageRef => ({
  kind: 'image',
  asset,
  alt,
});

export const poster = (): PublicImage => ({
  src: '/media/video/test.jpg',
  width: 1600,
  height: 900,
});

export function makeProject(overrides: Partial<Project> & Pick<Project, 'slug'>): Project {
  return {
    title: `Test ${overrides.slug}`,
    client: null,
    tags: ['product-saas'],
    primaryCategory: 'Test category',
    type: 'case-study',
    year: 2024,
    cover: image(),
    heroMedia: image(),
    summary: 'Test summary.',
    facts: {},
    externalLink: null,
    sections: {},
    permissionConfirmed: true,
    ...overrides,
  };
}

export const index = (featured: string[], displayOrder?: string[]): ProjectIndex => ({
  featured,
  displayOrder: displayOrder ?? featured,
});

/** The real site content with selected parts replaced. */
export const withContent = (patch: Partial<PortfolioContent>): PortfolioContent => ({
  ...content,
  ...patch,
});
