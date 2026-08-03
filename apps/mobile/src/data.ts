// ─── Reference data only — no fake user-specific data ────────────────────────
// All user-specific data (applications, documents, notifications) comes from the API.

// Smart AI response knowledge base — used as offline fallback
export const CHAT_KB: Array<[RegExp, string, string[]]> = [
  [
    /insurance|cover/i,
    'Travel medical insurance covering €30,000+ is mandatory for Schengen. UAE providers like AXA, Oman Insurance, and RSA offer single-trip policies from AED 80. Upload the insurance certificate — not the policy brochure — to the consulate portal.',
    ['How much is the fee?', 'Check my requirements', 'Book a consultant'],
  ],
  [
    /itinerary|flight|hotel|accommod/i,
    'Your itinerary must show confirmed or tentative flight + hotel reservations with matching dates. Non-refundable bookings are not required. Dates must match your insurance and bank statement — misaligned dates are a top rejection reason.',
    ['What insurance do I need?', 'Check my score', 'Find a consultant'],
  ],
  [
    /bank|fund|money|financ/i,
    'Schengen consulates typically require evidence of €65/day available. Your bank statement must be recent (≤3 months) and clearly show your name and account balance covering the full trip duration.',
    ['Any other documents needed?', 'Check requirements', 'Book expert review'],
  ],
  [
    /score|readiness|ready/i,
    'Your readiness score reflects how complete and consistent your application documents are. The main blockers are usually missing insurance and incomplete itinerary. Identity and financial evidence are weighted most heavily.',
    ['How to fix insurance gap?', 'Upload documents', 'Book a consultant'],
  ],
  [
    /appointment|slot|book|when|date/i,
    'French consulate appointments in Dubai are managed through VFS Global (vfsglobal.com). Slots open about 3 months ahead. For summer travel, book your appointment at least 6 weeks before your intended departure. Current wait is typically 7–10 business days after submission.',
    ['What documents to bring?', 'Check requirements', 'Get expert help'],
  ],
  [
    /reject|refus|denied/i,
    'Prior visa rejections must be disclosed on your application form. A rejection is not an automatic bar — you must explain what circumstances changed and provide stronger evidence. A consultant review is strongly recommended if you have been rejected before.',
    ['Book a consultant', 'Check my score', 'See requirements'],
  ],
  [
    /passport|scan|photo|glare|biometric/i,
    'A high-quality passport scan is critical — no glare, no cutoff edges, all four corners visible. Retake the scan under diffused lighting without flash. Biometric photo must be 35mm×45mm on a plain white background, taken within the last 6 months.',
    ['Check other documents', 'See full audit', 'What else is needed?'],
  ],
  [
    /fee|cost|pay|price|charge/i,
    'France Schengen visa fee: €80 for adults, €40 for children 6–12. VFS Global service fee: approximately AED 40 (~$11). Payment at the VFS centre on appointment day — cash and card accepted. The embassy fee is non-refundable even if rejected.',
    ['When to book appointment?', 'Check my score', 'See all requirements'],
  ],
  [
    /processing|time|long|days|weeks/i,
    'Standard processing for France from UAE is 10–15 business days after your VFS appointment. Peak summer season (May–August) can extend this by 3–5 days. Express or premium service is not available at French consulates in UAE.',
    ['Book appointment now', 'Check requirements', 'Get expert help'],
  ],
  [
    /uk|britain|british/i,
    'UK Standard Visitor visa from UAE: £115 fee, 15–20 business day processing, no biometric appointment needed (online application + courier). You must show ties to your home country and sufficient funds for your stay (no fixed daily requirement, but typically £1,000+ for a 2-week visit).',
    ['What documents for UK?', 'Compare countries', 'Book a consultant'],
  ],
  [
    /usa|america|b1|b2/i,
    'US B1/B2 visa from UAE: $185 MRR fee (non-refundable), requires DS-160 online application, interview at US Embassy Abu Dhabi or Consulate General Dubai. Wait times for interview vary — currently 30–90 days. Processing after interview: 2–5 business days.',
    ['What documents for USA?', 'Compare countries', 'Book a consultant'],
  ],
  [
    /canada|canadian/i,
    'Canada Visitor Visa from UAE: CAD 100 fee, online application only (no interview typically). Processing: 4–12 weeks. You need to show genuine intent to return and financial proof. Indian and Pakistani nationals typically provide biometrics.',
    ['What documents for Canada?', 'Compare countries', 'Book a consultant'],
  ],
  [
    /australia|australian/i,
    'Australia Tourist Visa (subclass 600) from UAE: AUD 145 fee, online application. Processing: 20–30 business days. Show financial evidence, return ties, and travel itinerary. No interview required in most cases.',
    ['What documents for Australia?', 'Compare countries', 'Book a consultant'],
  ],
];
