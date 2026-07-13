# 2026-07-13 repository security review

This directory preserves the complete, sealed pre-remediation security review for revision `e9825804099c6d277643719c61328b4c335d1114`.

- [Primary readable report](report.md)
- [Canonical findings](findings.json)
- [Canonical coverage](coverage.json)
- [Sealed manifest](scan-manifest.json)
- [SARIF export](exports/results.sarif)
- [Structural hardening review](hardening/hardening.md)
- Detailed source-backed finding reports and safe local PoCs are under `findings/`.

The report contains three low-severity contact findings. It is historical evidence, not a statement that the current branch remains vulnerable. The post-scan implementation and production firewall read-back are documented in [the implementation log](../../IMPLEMENTATION-LOG.md) and [current security operations](../../SECURITY.md).
