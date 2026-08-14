// Categories of Enquiry — each carries a focus instruction appended to the
// system prompt so the LLM concentrates its classical analysis appropriately.

export const ENQUIRY_CATEGORIES = [
  {
    id: 'general',
    label: 'General Chart Strength',
    focus:
      'Assess overall chart strength from the Rasi chart: lagna and lagna lord condition, key yogas (Raja, Dhana, Pancha Mahapurusha, Neecha Bhanga), benefic/malefic house placements, and Jaimini karakas if determinable from provided data. Do not compute anything not given.'
  },
  {
    id: 'career',
    label: 'Career & Profession (D10)',
    focus:
      'Focus on the 10th house, its lord, karaka Saturn/Sun/Mercury, and the provided D10 (Dasamsa) chart. If D10 data is not present in the chart data, ask the user to paste it before interpreting career specifics.'
  },
  {
    id: 'wealth',
    label: 'Wealth & Finances',
    focus:
      'Focus on the 2nd and 11th houses, their lords, Dhana yogas, Jupiter as karaka, and 5th/9th trikona support. Use only the provided charts; if a relevant varga (e.g., D2 Hora) is absent, note it and ask if the user wants to supply it.'
  },
  {
    id: 'relationships',
    label: 'Marriage & Relationships (D9)',
    focus:
      'Focus on the 7th house, its lord, Venus/Jupiter as karakas, Upapada if derivable strictly from provided arudha data, and the provided D9 (Navamsa) chart. If D9 is absent, ask for it.'
  },
  {
    id: 'health',
    label: 'Health & Longevity',
    focus:
      'Focus on the lagna, 6th/8th/12th houses and lords, Saturn and nodes, and classical arishta/ayur considerations. Avoid deterministic medical predictions; frame classically and cautiously.'
  },
  {
    id: 'timing',
    label: 'Timing of Events (Dasha)',
    focus:
      'Analyze timing ONLY from the dasha periods explicitly provided (Vimshottari mandatory; conditional dashas if pasted). Never compute dasha dates or balances. If the relevant mahadasha/antardasha listing is missing, ask the user to paste it from JHora.'
  },
  {
    id: 'transits',
    label: 'Transits (Gochara)',
    focus:
      'Analyze ONLY the transit positions explicitly provided in the transit section. Never compute current planetary positions. If no transit data is provided, ask the user to paste current Gochara data from JHora.'
  },
  {
    id: 'education',
    label: 'Education & Learning',
    focus:
      'Focus on the 4th and 5th houses, Mercury and Jupiter as karakas, and D24 (Siddhamsa) if provided. If D24 is absent, interpret from Rasi/D9 only and say so.'
  },
  {
    id: 'property',
    label: 'Home, Property & Vehicles (D4)',
    focus:
      'Focus on the 4th house, its lord, Mars/Moon/Venus karakas, and the provided D4 (Chaturthamsa) chart. If D4 is absent, ask the user to paste it.'
  },
  {
    id: 'spirituality',
    label: 'Spirituality & Dharma',
    focus:
      'Focus on the 9th and 12th houses, Jupiter and Ketu, karakamsha and Jaimini indications if determinable from provided data, and D20 (Vimsamsa) if supplied.'
  }
];
