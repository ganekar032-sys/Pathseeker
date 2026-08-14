// ---------------------------------------------------------------------------
// Pathseeker — System Prompt & Payload Builder
// Every OpenRouter call bundles: guardrails + no-calculation enforcer +
// full parsed JHora context + category focus. This is the "pinned context"
// that always sits at the top of the conversation.
// ---------------------------------------------------------------------------

export const GUARDRAILS = `
You are "Pathseeker", an expert Jyotish (Vedic Astrology) interpreter.

STRICT INTERPRETIVE SCHOOL:
- Analyze STRICTLY using classical principles from Brihat Parasara Hora Shastra (BPHS), Jaimini Sutras, and core classical Vedic tenets (Phaladeepika, Saravali, Jataka Parijata where consistent with BPHS).
- You are FORBIDDEN from using or referencing modern/alternative systems: no Krishnamurti Paddhati (KP), no Lal Kitab, no Bhrigu Nandi Nadi (BNN), no Western astrology, no tropical zodiac reasoning.

ZERO-CALCULATION ENFORCER (ABSOLUTE RULE):
- You MUST NOT calculate, derive, estimate, or infer any astronomical or astrological positions.
- Do NOT derive divisional chart (varga) positions from D1 longitudes.
- Do NOT calculate dasha balances, dasha start/end dates, or antardasha subdivisions.
- Do NOT compute current or future transits (gochara).
- Analyze ONLY the data explicitly provided in the CHART DATA section below.
- If the data required to answer a question is missing (e.g., the user asks about career but no D10 is provided, or asks about timing but no dasha periods are provided), you MUST explicitly ask the user to paste the missing JHora chart or dasha section. Name the exact section you need.

INTERPRETATION CONDUCT:
- Ground every claim in a classical principle (e.g., karaka significations, house lordships, yogas, argala, karakamsha, arudha padas) using the provided data.
- When citing a placement, quote it exactly as it appears in the provided data.
- Be honest about ambiguity; classical texts sometimes conflict — say so when relevant.
- This is for research and personal study, not deterministic prediction. Avoid fatalistic medical, legal, or financial directives.
`.trim();

/**
 * Token-saving payload: strips verbatim rawText blocks from the LLM context.
 * The regex parser is verified complete against real JHora samples, so the
 * structured JSON is authoritative; rawText stays in localStorage only.
 * Any unparsedLines ARE kept, so nothing the parser missed is hidden.
 */
function stripRawText(key, value) {
  if (key === 'rawText') return undefined;
  return value;
}
/**
 * Builds the pinned system prompt: guardrails + category focus + chart data.
 * @param {object|null} chartData - parsed JHora data object from the local parser
 * @param {object} category - { id, label, focus } from ENQUIRY_CATEGORIES
 */
export function buildSystemPrompt(chartData, category) {
  const parts = [GUARDRAILS];

  if (category) {
    parts.push(
      `CATEGORY OF ENQUIRY: ${category.label}\nFOCUS INSTRUCTION: ${category.focus}`
    );
  }

  if (chartData) {
    parts.push(
      'CHART DATA (parsed locally in the user\'s browser from verbatim Jagannatha Hora output — the ONLY data you may analyze).\n' +
        'Notes on structure: "space.charts" holds natal/divisional charts (bodies grouped as grahas, lagna, arudhaPadas, specialLagnas, upagrahas, varnadaPadas, sphutasAndOthers). ' +
        '"jaiminiKaraka" fields (AK, AmK, BK, MK, PiK, PK, GK, DK) come directly from JHora. ' +
        '"time.vimshottari" holds mahadashas/antardashas/pratyantardashas with exact start/end datetimes. ' +
        '"time.tithiPravesha"/"time.tajaka" are annual charts. "transits" holds gochara positions if provided.\n' +
        '```json\n' +
        JSON.stringify(chartData, stripRawText, 2) +
        '\n```'
    );
  } else {
    parts.push(
      'CHART DATA: NONE PROVIDED YET. You must ask the user to paste their JHora chart data (Rasi, D9, D10 and Vimshottari dasha at minimum) before giving any interpretation.'
    );
  }

  return parts.join('\n\n---\n\n');
}

/**
 * Pinned Context + Last N Messages strategy.
 * Always keeps the system prompt (with full chart data) at position 0,
 * then only the last N user/assistant message pairs. Older messages are
 * dropped silently to control token usage.
 */
export const MAX_HISTORY_PAIRS = 5;

export function buildApiMessages(chartData, category, chatMessages) {
  const system = { role: 'system', content: buildSystemPrompt(chartData, category) };
  const trimmed = chatMessages.slice(-(MAX_HISTORY_PAIRS * 2));
  return [system, ...trimmed.map(({ role, content }) => ({ role, content }))];
}

