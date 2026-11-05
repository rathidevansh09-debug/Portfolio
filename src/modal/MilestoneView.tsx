// Journey milestone item in the pop-up (PRD FR-J5, FR-M1; ARCHITECTURE A-6, I-11): the image shown
// whole in the media box, or a document's image preview plus "Open document ↗" (no embedded PDF).

import { OutlineButton } from '../components/actions/OutlineButton/OutlineButton.tsx';
import type { JourneyMilestone } from '../content/schema.ts';
import { ModalMedia, type ModalMediaLabels } from './ModalMedia.tsx';
import { SummaryRow } from './SummaryRow.tsx';

export function MilestoneView({
  milestone,
  titleId,
  openDocument,
  media,
}: {
  readonly milestone: JourneyMilestone;
  readonly titleId: string;
  /** "Open document" (ui.popup.openDocument). */
  readonly openDocument: string;
  readonly media: ModalMediaLabels;
}) {
  const { opens } = milestone;
  const image = opens.kind === 'document' ? opens.preview : opens;
  return (
    <>
      <ModalMedia media={image} labels={media} />
      <SummaryRow
        titleId={titleId}
        title={milestone.title}
        action={
          opens.kind === 'document' ? (
            <OutlineButton href={opens.href} external icon="arrow-up-right">
              {openDocument}
            </OutlineButton>
          ) : null
        }
      />
    </>
  );
}
