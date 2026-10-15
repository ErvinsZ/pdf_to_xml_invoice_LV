/* English UI strings. Values are plain strings with {param} placeholders, or
 * functions of params where pluralisation is needed. Keep keys in sync with lv.js. */

const plural = (n, one, many) => (n === 1 ? one : many);

export default {
  language: "Language",
  vatAbbr: "VAT",

  header: {
    from: "Invoice",
    to: "Peppol",
    subtitle: "e-invoice review · Horizon",
    generate: "Generate XML",
    errorsBadge: ({ count }) => `${count} ${plural(count, "error", "errors")}`,
    confirmTitle: "Generate anyway?",
    confirmBody: ({ count }) => `The invoice still has ${count} ${plural(count, "error", "errors")}. The server will most likely reject it and list the problems.`,
    confirmSend: "Generate anyway",
    cancel: "Cancel",
  },

  source: {
    title: "Source document",
    upload: "Upload PDF",
    replace: "Replace",
    frameTitle: "Invoice PDF",
    emptyTitle: "No document",
    emptyBody: "Upload an invoice PDF to extract it. The document preview will appear here, next to the extracted data.",
    dropHint: "or drag and drop it here",
    dropOverlay: "Drop the PDF to upload it",
  },

  review: {
    emptyTitle: "Nothing to review yet",
    emptyBody: "Upload a PDF to start extraction. The extracted fields and lines will appear here so you can review and correct them before generating Peppol XML.",
    invoiceInfo: "Invoice details",
    note: "Note",
    lines: "Invoice lines · {count}",
    noLines: "Extraction returned no lines.",
    addLine: "Add line",
    deleteLine: "Delete line",
    lineNumber: "Line {line}",
    lineComputed: "= Line",
    totals: "Totals — computed vs. printed on invoice",
    printedOnInvoice: "Printed on invoice:",
    missingId: "missing ID",
  },

  totals: {
    net: "Net excl. VAT",
    vat: "VAT",
    total: "Total",
  },

  status: {
    ok: "Reconciled — totals match the invoice.",
    errors: ({ count }) => `${count} ${plural(count, "error", "errors")}`,
    warnings: ({ count }) => `${count} ${plural(count, "warning", "warnings")}`,
    needsReview: "{summary} to review.",
  },

  flags: {
    LINE_MISMATCH: "Line {line}: qty × price = {computed}, but the invoice shows {printed}.",
    NET_MISMATCH: "Computed net {computed} vs. printed {printed} (Δ {delta}).",
    VAT_MISMATCH: "Computed VAT {computed} vs. printed {printed} (Δ {delta}).",
    TOTAL_MISMATCH: "Computed total {computed} vs. printed {printed} (Δ {delta}).",
    NO_RECIPIENT_ID: "Recipient has no VAT / registration number — Horizon won't be able to match the company.",
    NO_LINES: "The data contains no invoice lines.",
    serverPrefix: "Server: {message}",
    validationPrefix: "Validation: {message}",
  },

  health: {
    checking: "Checking connection...",
    up: "Server is up — {status}",
    badStatus: "Server responded {status}, waiting...",
    starting: "Server is starting...",
    waiting: "Waiting for server... ({seconds}s)",
  },

  toast: {
    close: "Dismiss",
    noApiBase: "Server address is not configured. Set VITE_API_BASE in the environment.",
    wakingExtract: "Waking up the server — the first request can take up to a minute…",
    wakingGenerate: "Waking up the server — this can take up to a minute…",
    extracted: ({ count }) => `Extracted ${count} ${plural(count, "line", "lines")} — review below.`,
    rejected: "The server rejected the invoice — see the problems below.",
    generated: "XML generated and downloaded.",
  },

  errors: {
    notPdf: "That file isn't a PDF. Please upload an invoice in PDF format.",
    badRequest: "The server couldn't process the file: {detail}",
    providerAuth: "The AI provider rejected the server's API key. Check the backend configuration.",
    rateLimited: "AI provider request limit reached. Wait a minute and try again.",
    extractionFailed: "Couldn't read this invoice. Try again, or try a clearer PDF.",
    server: "Server error ({status}).",
    unreachable: "Can't reach the server. Check your connection and try again.",
  },

  fields: {
    // top-level
    invoice_id: "Invoice no.", issue_date: "Issue date", due_date: "Due date",
    currency: "Currency", buyer_reference: "Buyer reference", contract_reference: "Contract reference",
    delivery_date: "Delivery date", note: "Note",
    // party containers
    supplier: "Supplier", customer: "Customer", delivery: "Delivery", payment: "Payment",
    // party fields
    name: "Name", reg_number: "Reg. no.", vat_number: "VAT no.",
    street: "Street", city: "City", postal_zone: "Postal code", country_code: "Country code",
    contact_name: "Contact person", contact_phone: "Phone", contact_email: "Email",
    iban: "IBAN", bic: "BIC", bank_name: "Bank", payment_id: "Payment ID", terms_note: "Payment terms",
    // line fields
    description: "Description", seller_item_id: "Item no.", quantity: "Quantity", unit_code: "Unit",
    net_unit_price: "Net price", vat_category: "VAT cat.", vat_percent: "VAT %",
    printed_line_total: "Amount (printed)",
    // printed totals
    net_excl_vat: "Net excl. VAT", total_vat: "Total VAT", grand_total_incl_vat: "Total incl. VAT",
  },
};
