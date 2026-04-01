interface AngelFlightCandidate {
  ident?: string | null;
  operator?: string | null;
}

const OPERATOR_KEYWORDS = ['air charity network', 'angel flight'];

export function isAngelFlight(candidate: AngelFlightCandidate): boolean {
  const ident = (candidate.ident || '').trim().toUpperCase();
  const operatorRaw = (candidate.operator || '').trim();
  const operator = operatorRaw.toUpperCase();
  const operatorLower = operatorRaw.toLowerCase();

  // Angel Flight missions are commonly flown under NGF call signs (e.g. NGF1066).
  if (ident.startsWith('NGF')) {
    return true;
  }

  if (operator === 'NGF' || operator.startsWith('NGF')) {
    return true;
  }

  return OPERATOR_KEYWORDS.some((keyword) => operatorLower.includes(keyword));
}
