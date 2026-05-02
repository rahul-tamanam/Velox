const DEFENSIVE_BASKET = {
  GLD: 0.4,
  TLT: 0.3,
  BIL: 0.2,
  VNQ: 0.1,
};

function getDefensiveWeights() {
  return { ...DEFENSIVE_BASKET };
}

module.exports = { DEFENSIVE_BASKET, getDefensiveWeights };
