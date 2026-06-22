Use this procedure when asked to curate entity metadata.

1. Load the local curation packet with `load_entity_curation_packet`.
2. Read the available tags before selecting any tag slugs.
3. Draft non-genre signals first: mood, scene, style, era, and format.
4. Keep genre ideas in `genreCandidatesForHumanReview` only.
5. Set `humanReviewed` to false and `reviewedBy` to an empty string.
6. Write the local draft with `write_entity_curation_draft`.
7. Remind the maintainer to review the JSON before running `pnpm curate:entity:sql`.
