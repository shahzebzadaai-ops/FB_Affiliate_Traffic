# Typography

Retain Fraunces and Source Sans 3. Fraunces supplies an editorial voice; Source Sans 3 carries navigation, operational UI and dense information. Distinction comes from composition and restrained use, not from adding more families.

Fraunces: weight 500, optical size 72, SOFT 0, WONK 0. Keep these axes fixed for visual consistency. Do not use soft or wonky styles for corporate headlines. Source Sans 3: 400 body, 600 controls and headings, 700 rare emphasis. Use genuine weights; disable synthetic bold/italic.

| Style | Font | Desktop / mobile px | Weight | Line height | Tracking |
|---|---|---:|---:|---:|---:|
| display-xl | Fraunces | 88 / 48 | 500 | 1.06 | -0.025em |
| display-l | Fraunces | 72 / 42 | 500 | 1.1 | -0.025em |
| h1 | Fraunces | 64 / 38 | 500 | 1.12 | -0.02em |
| h2 | Fraunces | 48 / 32 | 500 | 1.18 | -0.015em |
| h3 | Source Sans 3 | 32 / 26 | 600 | 1.25 | -0.01em |
| h4 | Source Sans 3 | 24 / 22 | 600 | 1.3 | 0em |
| body-large | Source Sans 3 | 24 / 20 | 400 | 1.5 | 0em |
| body | Source Sans 3 | 18 / 18 | 400 | 1.55 | 0em |
| body-small | Source Sans 3 | 16 / 16 | 400 | 1.5 | 0em |
| caption | Source Sans 3 | 14 / 14 | 400 | 1.4 | 0em |
| navigation | Source Sans 3 | 16 / 16 | 600 | 1.25 | 0em |
| button | Source Sans 3 | 16 / 16 | 600 | 1.25 | 0em |
| label | Source Sans 3 | 14 / 14 | 600 | 1.35 | 0.04em |
| data | Source Sans 3 | 16 / 16 | 400 | 1.4 | 0em |
| dashboard-heading | Source Sans 3 | 28 / 24 | 600 | 1.25 | -0.01em |


Use the mobile value at 390px; reach the desktop value at 1440px. In the supplied CSS, clamp formulas interpolate between those viewports. Body measure: 55-70 characters; editorial headline measure: 12-24 characters. Avoid justified text. Keep UI at 16px or larger; secondary captions may be 14px. Use tabular, lining numerals in tables, align amounts on the right, preserve currency symbols and decimal precision. Never use the serif for table data or long navigation labels.

Dashboard headings use Source Sans 3, not the public-site serif. Mobile tables keep a labelled horizontal scroll region or existing responsive card treatment; do not squeeze text below 14px.

## Font files and licensing

Original variable TTF files are included, unmodified, with the full SIL Open Font License files. They support commercial use and embedding under that licence. Keep the licence alongside redistributed font files. The PDF embeds static subsets for reliable rendering; those are document content, not replacement font products. The logo uses outlined Source Sans 3 forms with custom spacing and a square i dot; do not retype it.

Official sources:
- Fraunces: https://github.com/undercasetype/Fraunces
- Distribution and licence: https://github.com/google/fonts/tree/main/ofl/fraunces
- Source Sans 3: https://github.com/adobe-fonts/source-sans
- Distribution and licence: https://github.com/google/fonts/tree/main/ofl/sourcesans3

For production, self-host the original files through next/font/local, or obtain official WOFF2 builds to reduce payload. Do not silently substitute a different font. For email only, use Arial with live text for compatibility.
