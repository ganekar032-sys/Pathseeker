// Pathseeker — Chat export utility. Downloads the conversation as a clean .txt.

export function exportChatAsTxt(messages, { model, categoryLabel } = {}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const lines = [
    'PATHSEEKER — JYOTISH INTERPRETATION SESSION',
    `Exported: ${new Date().toString()}`,
    model ? `Model: ${model}` : null,
    categoryLabel ? `Category of Enquiry: ${categoryLabel}` : null,
    '='.repeat(60),
    ''
  ].filter(Boolean);

  for (const msg of messages) {
    const who = msg.role === 'user' ? 'YOU' : 'PATHSEEKER';
    lines.push(`--- ${who} ---`);
    lines.push(msg.content.trim());
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pathseeker-session-${stamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
