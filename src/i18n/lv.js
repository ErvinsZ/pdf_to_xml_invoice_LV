/* Latvian UI strings. Keep keys in sync with en.js. */

// Latvian plural: n ending in 1 (but not 11) takes the singular form
const plural = (n, one, many) => (n % 10 === 1 && n % 100 !== 11 ? one : many);

export default {
  language: "Valoda",
  vatAbbr: "PVN",

  header: {
    from: "Pavadzīme",
    to: "Peppol",
    subtitle: "e-rēķinu pārbaude · Horizon",
    generate: "Izveidot XML",
    errorsBadge: ({ count }) => `${count} ${plural(count, "kļūda", "kļūdas")}`,
  },

  source: {
    title: "Avota dokuments",
    upload: "Augšupielādēt PDF",
    replace: "Aizstāt",
    frameTitle: "Rēķina PDF",
    emptyTitle: "Nav dokumenta",
    emptyBody: "Augšupielādējiet rēķina PDF, lai to nolasītu. Dokumenta priekšskatījums parādīsies šeit blakus nolasītajiem datiem.",
    dropHint: "vai ievelciet to šeit",
    dropOverlay: "Atlaidiet PDF, lai to augšupielādētu",
  },

  review: {
    emptyTitle: "Vēl nav ko pārbaudīt",
    emptyBody: "Augšupielādējiet PDF, lai sāktu nolasīšanu. Nolasītie lauki un rindas parādīsies šeit pārbaudei un labošanai pirms Peppol XML izveides.",
    invoiceInfo: "Rēķina informācija",
    note: "Piezīme",
    lines: "Rēķina rindas · {count}",
    noLines: "Nolasīšana neatgrieza nevienu rindu.",
    addLine: "Pievienot rindu",
    deleteLine: "Dzēst rindu",
    lineNumber: "{line}. rinda",
    lineComputed: "= Rinda",
    totals: "Kopsummas — aprēķinātās pret rēķinā norādītajām",
    printedOnInvoice: "Rēķinā norādīts:",
    missingId: "trūkst ID",
  },

  totals: {
    net: "Summa bez PVN",
    vat: "PVN",
    total: "Summa kopā",
  },

  status: {
    ok: "Saskaņots — summas atbilst rēķinā norādītajām.",
    errors: ({ count }) => `${count} ${plural(count, "kļūda", "kļūdas")}`,
    warnings: ({ count }) => `${count} ${plural(count, "brīdinājums", "brīdinājumi")}`,
    needsReview: "{summary} jāpārbauda.",
  },

  flags: {
    LINE_MISMATCH: "{line}. rinda: daudz.×cena = {computed}, bet rēķinā norādīts {printed}.",
    NET_MISMATCH: "Aprēķinātā summa bez PVN {computed} pret rēķinā norādīto {printed} (Δ {delta}).",
    VAT_MISMATCH: "Aprēķinātais PVN {computed} pret rēķinā norādīto {printed} (Δ {delta}).",
    TOTAL_MISMATCH: "Aprēķinātā kopsumma {computed} pret rēķinā norādīto {printed} (Δ {delta}).",
    NO_RECIPIENT_ID: "Saņēmējam nav PVN / reģistrācijas numura — Horizon nevarēs atrast uzņēmumu.",
    NO_LINES: "Datos nav neviena rēķina rinda.",
    serverPrefix: "Serveris: {message}",
    validationPrefix: "Validācija: {message}",
  },

  health: {
    checking: "Pārbauda savienojumu...",
    up: "Serveris darbojas — {status}",
    badStatus: "Servera atbilde: {status}, gaida...",
    starting: "Serveris tiek inicializēts...",
    waiting: "Gaida serveri... ({seconds}s)",
  },

  toast: {
    close: "Aizvērt",
    noApiBase: "Servera adrese nav konfigurēta. Iestatiet VITE_API_BASE vidē.",
    wakingExtract: "Serveris tiek aktivizēts — pirmais pieprasījums var ilgt līdz minūtei…",
    wakingGenerate: "Serveris tiek aktivizēts — tas var ilgt līdz minūtei…",
    extracted: ({ count }) => `Nolasītas ${count} ${plural(count, "rinda", "rindas")} — pārbaudiet zemāk.`,
    rejected: "Serveris noraidīja rēķinu — skatiet problēmas zemāk.",
    generated: "XML izveidots un lejupielādēts.",
    generatedWithProblems: ({ count }) => `XML lejupielādēts, taču tajā ir ${count} ${plural(count, "problēma", "problēmas")} — pārbaudiet tās zemāk pirms nosūtīšanas uz Horizon.`,
  },

  errors: {
    notPdf: "Šis fails nav PDF. Lūdzu, augšupielādējiet rēķinu PDF formātā.",
    badRequest: "Serveris nevarēja apstrādāt failu: {detail}",
    providerAuth: "MI pakalpojums noraidīja servera API atslēgu. Pārbaudiet servera konfigurāciju.",
    rateLimited: "Sasniegts MI pakalpojuma pieprasījumu limits. Pagaidiet minūti un mēģiniet vēlreiz.",
    extractionFailed: "Neizdevās nolasīt šo rēķinu. Mēģiniet vēlreiz vai izmantojiet skaidrāku PDF.",
    server: "Servera kļūda ({status}).",
    unreachable: "Nevar sazināties ar serveri. Pārbaudiet savienojumu un mēģiniet vēlreiz.",
  },

  fields: {
    // top-level
    invoice_id: "Rēķina nr.", issue_date: "Izrakstīšanas datums", due_date: "Apmaksas termiņš",
    currency: "Valūta", buyer_reference: "Pircēja atsauce", contract_reference: "Līguma atsauce",
    delivery_date: "Piegādes datums", note: "Piezīme",
    // party containers
    supplier: "Piegādātājs", customer: "Saņēmējs", delivery: "Piegāde", payment: "Maksājums",
    // party fields
    name: "Nosaukums", reg_number: "Reģ. nr.", vat_number: "PVN nr.",
    street: "Iela", city: "Pilsēta", postal_zone: "Pasta indekss", country_code: "Valsts kods",
    contact_name: "Kontaktpersona", contact_phone: "Tālrunis", contact_email: "E-pasts",
    iban: "IBAN", bic: "BIC", bank_name: "Banka", payment_id: "Maksājuma ID", terms_note: "Apmaksas noteikumi",
    // line fields
    description: "Apraksts", seller_item_id: "Artikuls", quantity: "Daudzums", unit_code: "Mērv.",
    net_unit_price: "Cena bez PVN", vat_category: "PVN kat.", vat_percent: "PVN %",
    printed_line_total: "Summa (rēķinā)",
    // printed totals
    net_excl_vat: "Summa bez PVN", total_vat: "PVN kopā", grand_total_incl_vat: "Summa kopā",
  },
};
