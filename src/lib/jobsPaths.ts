// The public jobs pages live under the Join OSTA Team page. The ERP builds the same addresses for share links
// (PUBLIC_JOBS_PATH there), so change both together if this ever moves.
export const JOBS_PATH = "/join-osta-team/jobs";
export const jobPath = (slug: string) => `${JOBS_PATH}/${slug}`;
