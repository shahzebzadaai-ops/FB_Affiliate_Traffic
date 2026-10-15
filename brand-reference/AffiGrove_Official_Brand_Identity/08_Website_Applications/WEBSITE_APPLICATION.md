# Corporate website application

The supplied SVG/PNG files are visual concepts, not screenshots of the existing site. They cover homepage, About, What We Do, Approach, Careers, Contact, mobile home, mobile menu, footer and control states. The homepage includes a repeatable original Grove Loop vector field; it is abstract brand art, not a performance chart.

Grid: max content width 1312px; 64px desktop gutters, 24px mobile; 12 columns and 32px gaps. Stack content below 768px. Corporate sections use 96-128px vertical spacing on desktop and 48-64px on mobile. Keep navigation compact, one filled primary CTA per decision area, and secondary links visibly subordinate. Cards have 2px corners and no shadow; use section rules and open rows when grouping is sufficient.

Homepage narrative: audience-led purpose, three work areas, approach, contact, footer. Subpages carry a short editorial introduction and useful open rows. Careers sample copy is a layout concept, not a claim that roles are open. The Contact sample tells developers to retain the verified live route; it must not be published as replacement contact copy. Final text needs owner review.

Do not copy the visual concept as a wholesale route or business-logic replacement. Reuse current components where practical. Preserve approved legal copy and existing routes. Supply real About content before adding biographies, office photography or team facts. No partner logo wall or fabricated stats.

Mobile menu: actual button with aria-expanded and aria-controls, Escape closes, focus returns to trigger, correct focus trapping if modal. Do not implement purely CSS hover navigation. Keep links usable without animations and respect reduced motion. Maintain a skip link and one logical H1 per page.

SVG mockups outline text for portable viewing. The production site must use real HTML text, semantic controls and the supplied fonts. These artboards are not accessible substitutes for a working website.


## Owner correction / v1.1 - dark corporate background

The owner likes the identity and existing website, and requested a dark background instead of cream. This instruction supersedes the earlier cream-background direction. Apply only the surface/text/interaction colour adjustment on the current corporate website; preserve current layout, logo, typography, content, spacing and behaviour. Do not use this correction as permission to redesign the site or reapply the whole package.

Corporate canvas #111B16; panels #1D2B23; main text #F3EFE6; secondary text #BBC9BC; dividers #3D5042; essential control borders #7D9583; sage actions #BDD5BF with #111B16 labels. Keep Grove Green #1A5C42 for brand panels. Warm Paper remains an approved text/print colour, not a default website background.

The live stylesheet checked on 15 October already declared `.grove { --grove-paper:#000; color-scheme:dark }` and a black header/footer. Check the actual deployed version and cache before editing; do not assume the cream rendition is still current. Preserve the existing public site's current fonts and layout during this colour-only change. All Facebook publishing operations stay disabled.
