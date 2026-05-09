function isDemoMode() {
  const v =
    process.env.DEMO_MODE ??
    process.env.VELOX_DEMO ??
    process.env.DEMO ??
    '';
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return Boolean(v);
}

module.exports = { isDemoMode };

