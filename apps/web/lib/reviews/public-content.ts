const disallowedPublicReviewMarkup = /<\s*\/?\s*(?:script|style|iframe|object|embed|svg|math)\b|javascript\s*:/i;
const lowSignalRepeatedText = /^(?:asd|asdf|qwer|zxc|test|foo|bar|blah|lorem)+$/i;

function isObviousTestText(value: string | null | undefined) {
  const compactValue = (value ?? "").replace(/[\s\W_]+/g, "");

  return compactValue.length >= 6 && lowSignalRepeatedText.test(compactValue);
}

export function isPublicReviewDisplayable(review: {
  title?: string | null;
  body?: string | null;
}) {
  if (isObviousTestText(review.title) || isObviousTestText(review.body)) {
    return false;
  }

  return ![review.title, review.body]
    .filter((value): value is string => Boolean(value))
    .some((value) => disallowedPublicReviewMarkup.test(value));
}
