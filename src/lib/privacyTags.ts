// Central definition of the privacy tags used when masking / anonymizing text.
// Each masked word is annotated with exactly one of these tags so that
// researchers can later see *what kind* of personal data was removed
// (without needing the plaintext itself).

export type PrivacyTagId =
  | "direct_identifier"
  | "sensitive_attribute"
  | "third_party_pii"
  | "quasi_identifier"
  | "secret_credential"
  | "other";

export interface PrivacyTag {
  id: PrivacyTagId;
  /** Short label shown on badges and menu items. */
  label: string;
  /** The self-check question that helps the user pick this tag. */
  question: string;
  /** Plain-language explanation. */
  description: string;
  /** A short, concrete everyday example. */
  example: string;
  /** Tailwind classes for the badge (background + text + border). */
  badgeClass: string;
  /** A small color dot class used in menus. */
  dotClass: string;
}

// Ordered intentionally: the Quasi-Identifier Combination is the hardest to
// grasp, so it is listed with its example leading in the description.
export const PRIVACY_TAGS: PrivacyTag[] = [
  {
    id: "direct_identifier",
    label: "This points straight to me",
    question: "Could someone tell it's me just from this?",
    description: "Details that name or reach you directly.",
    example: "e.g. your name, address, phone number, email, or birthday",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    dotClass: "bg-red-500",
  },
  {
    id: "sensitive_attribute",
    label: "Something very personal about me",
    question: "Is this a private thing I'd rather keep to myself?",
    description: "Personal facts that deserve extra protection, even without your name.",
    example: "e.g. an illness, your religion, sexuality, or political views",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    dotClass: "bg-purple-500",
  },
  {
    id: "third_party_pii",
    label: "About another person, not me",
    question: "Does this reveal who someone else is?",
    description: "Information that identifies a different person you mention.",
    example: "e.g. your boss's, partner's, or friend's name",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  {
    id: "quasi_identifier",
    label: "Harmless alone, revealing together",
    question: "Small on its own, but identifying when pieces combine?",
    description: "Each detail seems minor, yet together they can pin down who you are.",
    example: "e.g. age + zip code + job — combined, they can point to you",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    dotClass: "bg-blue-500",
  },
  {
    id: "secret_credential",
    label: "A password or secret code",
    question: "Is this login info or a key that should stay secret?",
    description: "Access data that would let someone into an account or system.",
    example: "e.g. a password, API key, or access token",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  {
    id: "other",
    label: "Something else I'd rather hide",
    question: "Feels private, but none of the above fit?",
    description: "A catch-all for anything personal that doesn't match the other options.",
    example: "e.g. anything private you still want to black out",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
    dotClass: "bg-gray-400",
  },
];

export const DEFAULT_TAG_ID: PrivacyTagId = "direct_identifier";

export const getPrivacyTag = (id: PrivacyTagId): PrivacyTag =>
  PRIVACY_TAGS.find((t) => t.id === id) ?? PRIVACY_TAGS[PRIVACY_TAGS.length - 1];

/** A word/phrase to mask, together with its chosen privacy tag. */
export interface MaskedWord {
  word: string;
  tag: PrivacyTagId;
}
