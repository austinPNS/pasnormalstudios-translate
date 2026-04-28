// Resolve the Sanity Studio URL for a given doc using an intent URL:
//   <studioBase>/intent/edit/id=<id>;type=<type>
//
// Set `NEXT_PUBLIC_SANITY_STUDIO_URL` to the studio's base URL
// (e.g. `https://pasnormalstudios.com/studio`). Trailing slash optional.
//
// Falls back to the default Sanity-hosted studio when not set.
//
// `drafts.` prefix is stripped — Studio resolves drafts from the bare id.

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
const STUDIO_BASE = (process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? '').replace(/\/$/, '');

const stripDrafts = (id: string): string =>
  id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;

export const getStudioUrl = (docId: string, sanityType: string): string => {
  const bareId = stripDrafts(docId);
  const base = STUDIO_BASE || `https://${PROJECT_ID}.sanity.studio`;
  // Intent URLs use ; to separate parameters and = for key/value. Don't
  // url-encode the ; or =, but do encode the values themselves.
  const idPart = encodeURIComponent(bareId);
  const typePart = encodeURIComponent(sanityType);
  return `${base}/intent/edit/id=${idPart};type=${typePart}`;
};
