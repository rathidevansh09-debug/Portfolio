// Interface wording (ARCHITECTURE §4.2; PRD D-02, §6, §13; DESIGN §7–§8).
// Status rule (owner decision, Checkpoint 5): exact wording marked [DRAFT COPY] in PRD/DESIGN is
// `draft` (approved before launch); exact wording the approved documents specify without that mark
// is `approved`; wording only inferred from references or given as an example is PENDING.
// `{name}` placeholders are filled in by components, e.g. {count}, {query}, {shown}, {total}.

import { pending } from './pending.ts';
import { approved, draft, type UiCopy } from './schema.ts';

export const ui = {
  nav: {
    skipToWork: approved('Skip to work'), // FR-G2
    home: approved('Home'), // FR-H6
    work: draft('Work'), // FR-H2
    impact: draft('Impact'),
    about: draft('About'),
    journey: draft('Journey'),
    contact: draft('Contact'),
    motionOn: approved('Motion on'), // FR-H4
    motionOff: approved('Motion off'),
    letsTalk: approved("Let's talk"), // FR-H5 (arrow is an icon)
    menuButton: pending('Accessible label for the mobile menu button'),
    closeMenu: pending('Accessible label for closing the mobile menu'),
  },
  hero: {
    seeMyWork: draft('See my work'), // FR-HE4 (arrow direction open: I-5)
    downloadCv: approved('Download CV'), // FR-HE6
    playShowreel: approved('PLAY SHOWREEL'), // FR-HE7
    showreelSecondary: draft('MOTION / VIDEO'),
    scrollToDiscover: approved('SCROLL TO DISCOVER'),
    editionLabel: draft('SELECTED WORK'), // "SELECTED WORK / [start year]–2026"
  },
  work: {
    eyebrow: approved('01 / SELECTED WORK'), // FR-W1
    headline: draft('WORK THAT SPEAKS.'),
    allWorkToggle: approved('ALL WORK'),
    selectedWorkToggle: approved('SELECTED WORK'),
    filterAll: approved('All'), // D-03
    search: approved('Search'), // DESIGN §7.4
    showMore: approved('Show more work'), // FR-W6
    count: approved('{shown} of {total} projects'), // FR-W6 "X of Y projects"
    empty: approved("No work found for '{query}'."), // FR-W7
    resetSearch: approved('Reset search'),
    resultAnnouncement: pending(
      'Screen-reader result-count wording (A-8), e.g. "{count} projects shown"',
    ),
    // FR-W4 gives chip wording only as examples ("e.g."), so all four stay PENDING.
    typeCaseStudy: pending('Card chip label for case-study projects'),
    typeWebsite: pending('Card chip label for website projects'),
    typeVideoMotion: pending('Card chip label for video/motion projects'),
    typeBeforeAfter: pending('Card chip label for before/after projects'),
  },
  brands: {
    headingLine1: draft('BEEN PART OF'), // FR-B1
    headingLine2: draft('THE BIGGER PICTURE.'),
    seeAll: approved('SEE ALL ({count})'),
    pause: pending('Accessible label for the logo-strip pause/play button'),
    previous: pending('Accessible label for the previous-logos button'),
    next: pending('Accessible label for the next-logos button'),
  },
  impact: {
    eyebrow: draft('IMPACT & MILESTONES'), // FR-I2
    headlineLine1: draft('THE WORK.'),
    headlineLine2: draft('THE IMPACT.'),
    listHead: approved('SELECTED MILESTONES'),
    showMore: approved('Show more milestones'),
  },
  breakdown: {
    eyebrow: draft('A LOOK UNDER THE SURFACE'), // FR-BD1
    headlineLine1: draft('FROM WIREFRAME.'),
    headlineLine2: draft('TO FINAL.'),
    labelBefore: draft('WIREFRAME'), // FR-BD2
    labelAfter: draft('FINAL DESIGN'),
    caption: draft('DRAG TO SEE THE PROCESS'),
    captionHint: draft('DRAG / SCROLL'),
    sliderLabel: approved('Compare wireframe and final design'), // DESIGN §12
  },
  about: {
    eyebrow: draft('02 / BEHIND THE SCREENS'), // FR-A1
    headlineLine1: draft('NOT JUST VISUALS.'),
    headlineLine2: draft('BUT HOW IT WORKS.'),
    educationAndSkills: approved('EDUCATION & SKILLS'), // DESIGN §8.6
    education: approved('EDUCATION'),
    coursesAndWorkshops: approved('COURSES & WORKSHOPS'),
    skills: approved('SKILLS'),
    supporting: approved('SUPPORTING'), // DS-12
    processTitle: draft('FROM INSIGHT TO FINAL SCREEN'), // FR-A2
  },
  journey: {
    eyebrow: approved('03 / THE JOURNEY'), // FR-J1
    headline: draft('KEEP MOVING. KEEP CREATING.'),
    resume: approved('RESUME'),
    promoted: approved('PROMOTED'), // D-15 ("↑ PROMOTED"; arrow is an icon)
    // D-15 shows "promoted from" only inside an example, so the wording stays PENDING.
    promotedFrom: pending(
      'Wording linking a promoted role to the previous one, e.g. "promoted from"',
    ),
    present: pending('Wording for a current role\'s end date (e.g. "present")'),
    milestonesEyebrow: draft('A FEW MILESTONES'), // FR-J5
    milestonesHeadlineLine1: draft('LITTLE WINS.'),
    milestonesHeadlineLine2: draft('BIG MEANING.'),
  },
  contact: {
    eyebrow: draft('04 / YOUR NEXT PROJECT'), // FR-C1
    headlineLine1: draft("LET'S WORK"),
    headlineLine2: draft('TOGETHER.'),
    line: draft(
      "Have a product that needs to work better? Let's build something people enjoy using.",
    ),
    cta: draft('START A CONVERSATION'),
    labelEmail: approved('EMAIL'), // FR-C2
    labelWhatsapp: approved('WHATSAPP / PHONE'),
    labelLinkedin: approved('LINKEDIN'),
    labelBasedIn: approved('BASED IN'),
    showreelTitle: draft('MOTION / SHOWREEL — MAKE IT FEEL REAL.'), // FR-C3
    showreelCaption: draft('PRESS PLAY. ENTER MY WORLD.'),
    briefToggle: draft('Tell me about your project'), // FR-C4
    fieldName: approved('Name'),
    fieldProjectType: approved('Project type'),
    fieldMessage: approved('Message'),
    sendWhatsapp: approved('Send via WhatsApp'), // FR-C5
    sendEmail: approved('Send via Email'),
    requiredError: pending('Inline message for an empty required field (FR-C6)'),
    sentConfirmation: pending('Short confirmation after sending (FR-C6)'),
    formNote: pending('Small note under the send buttons (DESIGN §8.8)'),
  },
  footer: {
    copyright: draft('© 2026 Devansh. Designed & built with care.'), // FR-F1
    backToTop: pending('Accessible label for the back-to-top link'),
  },
  popup: {
    overview: draft('OVERVIEW'), // DESIGN §8.10 section labels; numbers added by code
    problem: draft('PROBLEM'),
    research: draft('RESEARCH'),
    processAndDecisions: draft('PROCESS & DECISIONS'),
    finalDesigns: draft('FINAL DESIGNS'),
    outcomes: draft('OUTCOMES'),
    factClient: approved('CLIENT'), // D-20, D-22
    factYear: approved('YEAR'),
    factMyRole: approved('MY ROLE'),
    factTeam: approved('TEAM'),
    factPlatform: approved('PLATFORM'),
    factTools: approved('TOOLS'),
    visitLiveSite: pending(
      'External-link button wording (FR-M3 gives "Visit live site" as an example)',
    ),
    toggleWireframe: approved('Wireframe'), // DESIGN §8.10
    toggleFinal: approved('Final'),
    openDocument: approved('Open document'), // A-6
    close: pending('Accessible label for the pop-up close button'),
  },
  states: {
    imageUnavailable: approved('Preview unavailable'), // PRD §13
    loading: approved('Loading…'),
    videoError: approved("Preview couldn't load. Open the original source to watch."),
    tryAgain: approved('Try again'),
    openOriginal: approved('Open original'),
    restrictedNote: approved("If the video is restricted, use 'Open original'."),
  },
} satisfies UiCopy;
