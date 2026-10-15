export const isScalar = (v) => v === null || ["string", "number", "boolean"].includes(typeof v);

/* Nested objects of the extraction rendered as editable cards, in display order. */
export const PARTY_KEYS = ["supplier", "customer", "delivery", "payment"];

export const isPlainObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
