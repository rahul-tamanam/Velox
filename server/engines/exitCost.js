function computeExitCost({
  quantity,
  buyPrice,
  sellPrice,
  buyDate,
  taxBracketPct,
  brokerageFeePct = 0.1,
}) {
  const qty = Number(quantity) || 0;
  const bp = Number(buyPrice) || 0;
  const sp = Number(sellPrice) || 0;
  const bracket = Number(taxBracketPct) / 100;
  const feePct = Number(brokerageFeePct) / 100;

  const grossProceeds = qty * sp;
  const brokerageFee = grossProceeds * feePct;
  const stt = grossProceeds * 0.001;
  const buyTs = new Date(buyDate).getTime();
  const holdMs = Date.now() - buyTs;
  const shortTerm = holdMs < 365.25 * 24 * 3600 * 1000;
  const gain = (sp - bp) * qty;
  const taxableGain = Math.max(0, gain);
  const tax = taxableGain * bracket;

  const netProceeds = grossProceeds - brokerageFee - stt - tax;

  return {
    grossProceeds,
    brokerageFee,
    stt,
    shortTerm,
    longTerm: !shortTerm,
    estimatedTax: tax,
    netProceeds,
    classification: shortTerm ? 'short-term' : 'long-term',
  };
}

module.exports = { computeExitCost };
