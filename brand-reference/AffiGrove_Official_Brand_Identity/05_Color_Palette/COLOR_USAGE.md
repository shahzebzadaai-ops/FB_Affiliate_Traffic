# Colour specifications

All values are sRGB for digital use. No CMYK conversion is presented as a universal print match; ask the printer for a profile-specific proof.

Primary brand colour: Grove Green. Corporate background: Night #111B16. Raised surfaces: #1D2B23. Main text: Warm Paper #F3EFE6. Secondary text: #BBC9BC. Sage is the accessible dark-surface accent and action fill. Warm Paper is not a corporate page background.

Suggested corporate area balance: 75% Night/raised dark surfaces, 15% Grove Green panels, 10% text, sage accents and structure. This is a composition guide, not a quota. Never force a status colour into a marketing page. Dark OS: roughly 75% night/surface, 20% neutral text and structure, 5% action or status emphasis.

| Token | HEX | RGB | HSL |
|---|---|---|---|
| green | #1A5C42 | 26, 92, 66 | 156.4°, 55.9%, 23.1% |
| ink | #1A241C | 26, 36, 28 | 132.0°, 16.1%, 12.2% |
| paper | #F3EFE6 | 243, 239, 230 | 41.5°, 35.1%, 92.7% |
| white | #FFFFFF | 255, 255, 255 | 0.0°, 0.0%, 100.0% |
| mist | #E4EBE3 | 228, 235, 227 | 112.5°, 16.7%, 90.6% |
| muted | #536057 | 83, 96, 87 | 138.5°, 7.3%, 35.1% |
| line | #CCD4CA | 204, 212, 202 | 108.0°, 10.4%, 81.2% |
| control | #748074 | 116, 128, 116 | 120.0°, 4.9%, 47.8% |
| hover | #124831 | 18, 72, 49 | 154.4°, 60.0%, 17.6% |
| pressed | #0D3524 | 13, 53, 36 | 154.5°, 60.6%, 12.9% |
| sage | #BDD5BF | 189, 213, 191 | 125.0°, 22.2%, 78.8% |
| night | #111B16 | 17, 27, 22 | 150.0°, 22.7%, 8.6% |
| surface | #1D2B23 | 29, 43, 35 | 145.7°, 19.4%, 14.1% |
| dark-text | #F3EFE6 | 243, 239, 230 | 41.5°, 35.1%, 92.7% |
| dark-muted | #BBC9BC | 187, 201, 188 | 124.3°, 11.5%, 76.1% |
| dark-line | #3D5042 | 61, 80, 66 | 135.8°, 13.5%, 27.6% |
| dark-control | #7D9583 | 125, 149, 131 | 135.0°, 10.2%, 53.7% |
| dark-hover | #D3E5D3 | 211, 229, 211 | 120.0°, 25.7%, 86.3% |
| dark-pressed | #A2C3A5 | 162, 195, 165 | 125.5°, 21.6%, 70.0% |
| success | #226344 | 34, 99, 68 | 151.4°, 48.9%, 26.1% |
| success-bg | #E6F2E9 | 230, 242, 233 | 135.0°, 31.6%, 92.5% |
| warning | #80531A | 128, 83, 26 | 33.5°, 66.2%, 30.2% |
| warning-bg | #FFF2DC | 255, 242, 220 | 37.7°, 100.0%, 93.1% |
| error | #A63432 | 166, 52, 50 | 1.0°, 53.7%, 42.4% |
| error-bg | #FBE9E7 | 251, 233, 231 | 6.0°, 71.4%, 94.5% |
| info | #285B75 | 40, 91, 117 | 200.3°, 49.0%, 30.8% |
| info-bg | #E7F1F6 | 231, 241, 246 | 200.0°, 45.5%, 93.5% |
| engine | #80531A | 128, 83, 26 | 33.5°, 66.2%, 30.2% |
| operator | #285B75 | 40, 91, 117 | 200.3°, 49.0%, 30.8% |


## Accessibility

Normal text: at least 4.5:1. Large text: at least 3:1 (24px regular or 18.67px bold). Essential control boundaries and non-text indicators: at least 3:1 against adjacent colours. Decorative dividers are deliberately lighter; never use `line` alone as the only way to identify an input or selected state. Use `control` or `dark-control` for essential boundaries. No state relies on colour alone.

See contrast-report.json for computed pair ratios. Night-on-sage is the default corporate action. White-on-green remains an approved alternative. Light palettes are supporting options, not the corporate default. Dark status labels use the same pale status capsules as light mode, so their text pair remains verified. Check real focus rings against all neighbouring surfaces, error copy, disabled states and hover states during implementation.

Use semantic --ag-ui-* tokens for components, not raw brand hex values. Dark mode is explicit data-ag-theme="dark"; do not infer user preference or overwrite an application's existing theme choice.
