---
name: German Translation Style Guide
description: Style rules for EN→DE translation for Pas Normal Studios content. Derived from approved translations across product, uberProduct, feature.product, pnsCategory, and pnsCollection documents.
type: reference
---

# German (DE) Translation Style Guide

> **PRIORITY ORDER:**
> 1. `data/protected-terms.json` — absolute blocklist, never translate these terms
> 2. `data/prompts.json` → `de.specialRules` — official DE rules (36 items)
> 3. This style guide — learned patterns, supplements the above

## 1. Gender Prefixes — CONTEXT-DEPENDENT

### Product titles (product, uberProduct)
| English | German |
|---|---|
| Men's | Männer |
| Women's | Frauen |
| (no gender / unisex) | (no prefix, title unchanged) |

- Product name stays English after prefix: "Frauen Off-Race Cotton Tech Top"
- "Gilet" stays English in product titles: "Frauen Essential Insulated Gilet" — NEVER translate to "Weste"
- "Insulated" → "Isolierte" can be translated in titles

### Category titles (pnsCategory) — DIFFERENT PATTERN
| English | German | Example |
|---|---|---|
| Men's | Herren / für Herren | "Herren-Radtrikots", "Base Layers für Herren" |
| Women's | Damen / für Damen | "Damen-Fahrradjacken", "Base Layer für Damen" |
| (unisex/neutral) | Fully translated | "Fahrradzubehör", "Fahrradhelme" |

- Category titles are fully translated into natural German commerce terms
- "Cycling" → "Radsport-" / "Rad-" / "Fahrrad-" compound prefix
- "Jerseys" → "Trikots" / "Radtrikots" (in category context)
- "Bib Shorts" → "Bib-Shorts" (kept English with hyphen)
- "Jackets & Gilets" → "Jacken und -westen" / "Jacken & Gilets"
- "Casual Clothing" → "Freizeitbekleidung" / "Lässige Bekleidung"

### Collection titles (pnsCollection)
- ALL collection names stay in English: Balance, Mechanism, Essential, Off-Race, PAS, Escapism
- Collaboration names stay in English: "Pas Normal Studios x Diemme"

## 2. Tone & Voice

- **Informal "Du" form** throughout: "Trage es", "Kombiniere sie", "dich", "du", "deine"
- **Premium, calm, confident** — like a high-end sportswear brand
- **Active voice** always: describe what the product DOES, not what it HAS
- Avoid "Mit seinem...", "Es ist...", "Es bietet..." openers
- **Concise** — German often shorter than English source
- **Meaning-first** — reconstruct naturally in German, never literal word-for-word

## 3. Locked Terminology

### Technical terms
| English | German | Context |
|---|---|---|
| breathability | Atmungsaktivität | All specification descriptions |
| moisture-wicking | feuchtigkeitsregulierend | Product descriptions & specs |
| wind protection | Schutz vor Wind | NEVER "Windschutz" or "Windabweisend" |
| water protection | Schutz vor Regen | NEVER "Wasserschutz" or "Wasserabweisend" |
| water-repellent | Ausrüstung für Schutz vor Regen | In product descriptions |
| fabric / material | Material | NEVER "Stoff" or "Gewebe" |
| base layer | Baselayer | Kept in English |
| gilet | Weste (in descriptions) / Gilet (in titles) | Translate to "Weste" in descriptions & context text, keep "Gilet" in product titles |
| outer layer | äußere Schicht (or omit) | Simplify where possible |
| fit | Passform | All fit descriptions |
| insulation / thermal | Wärme / wärmend / isolierend | NEVER "Kälteschutz" |
| fully-dyed | komplett durchgefärbt | NOT "vollständig durchgefärbt" |
| cycling | Radfahren | NOT "Straßenfahren" |
| elastics | Elastik / Elastikbänder | NOT "Elastiken" |
| fleece-backed | Fleece-Innenseite / aufgeraut | Context-dependent |
| reflective | reflektierend | Adjective form |
| Mesh | Mesh | Kept in English |
| arm warmers | Armlinge | Cycling accessories |
| easy-care | pflegeleicht | Fabric property |
| wrinkle-free | knitterfrei | Fabric property |
| quick-drying | schnell trocknend | Fabric property |
| road-optimised | auf die Straße optimiert | Fit/use context |
| low-intensity riding | lockere Ausfahrten | NOT "niedrigintensives Fahren" |
| leisure rides | Freizeitfahrten | Casual riding context |
| sportives | Jedermannrennen | Event type |
| limited (protection) | gezielt / gezielten Schutz | Positive reframe — NEVER "begrenzt" for wind/water |

### Product feature terms
| English | German |
|---|---|
| UV Protection | UV-Schutz |
| Moisture Management | Feuchtigkeitsregulierung |
| Pockets | Taschen |
| Adjustable | Verstellbar |
| Lens (eyewear) | Glas |
| chamois | Sitzpolster |
| chamois stitching | Naht am Sitzpolster |
| straps | Träger |
| elastic grippers | Elastik-Gripper |
| packable | packbar |
| silicone elastic | Silikon-Elastik |
| taped (seams/pockets) | abgeklebt |
| DWR (Durable Water Repellent) | DWR (kept as abbreviation) |
| PFC-free | PFC-frei |
| ripstop | Ripstop (kept English) |
| laser-cut | per Laser geschnitten / lasergeschnitten |
| back pocket (cycling) | Rückentasche / Trikottasche |

### Category-specific terms (for pnsCategory translations)
| English | German |
|---|---|
| Cycling | Radsport- / Rad- / Fahrrad- (compound prefix) |
| Jerseys (category) | Trikots / Radtrikots |
| Bib Shorts | Bib-Shorts |
| Jackets | Jacken / Radsportjacken |
| Casual Clothing | Freizeitbekleidung |
| Accessories | Zubehör / Fahrradzubehör |
| Helmets | Helme / Fahrradhelme |
| Base Layers | Base Layers (kept English in category titles) |

## 4. Description Patterns

### Product descriptions (Portable Text blocks)
- Full paragraph, natural flow — not sentence-by-sentence translation
- Compound English terms rebuilt logically in German
- Technical brand terms kept: Coolmax®, Ecomade, Pertex, Polartec®, Nylon
- Measurements kept as-is: "10.000mm", "7 m²Pa/W (ISO 11092)", "190 g/m²"
- "back pocket" in cycling context can be "Trikottasche" (jersey pocket) for more natural feel

### Details field (plain text bullet lists)
- Each line translated independently, concisely
- Format preserved (line breaks, colons in "Material: 100% Nylon")
- Examples:
  - "Two-way front zipper" → "Zwei-Wege-Frontreißverschluss"
  - "Twin needle stitched hem and cuff" → "Saum und Bündchen mit Doppelnaht"
  - "Fully dyed fabrics and elastic grippers" → "Komplett durchgefärbtes Material und Elastik-Gripper"
  - "Aerodynamic race fit" → "Aerodynamische Race-Passform"
  - "Mesh-structured straps" → "Träger mit Mesh-Struktur"
  - "Durable zigzag chamois stitching" → "Langlebige Zickzack-Naht am Sitzpolster"
  - "Four-layer ultralight foam chamois" → "Vierlagiges, ultraleichtes Sitzpolster aus Schaum"

### Specification descriptions
- **Technical definitions** (e.g., "X is defined as..."): preserve definition structure with spec-specific openers:
  - Breathability: "Atmungsaktivität beschreibt die Fähigkeit des Materials, Schweiß nach außen zu leiten."
  - Insulation: "Isolierung wird durch die Fähigkeit eines Materials definiert, dich warm zu halten und vor Kälte zu schützen."
  - Wind Protection: "Schutz vor Wind wird durch die Fähigkeit eines Produkts definiert, das Eindringen von Wind in das Material zu verhindern."
  - Water Protection: "Schutz vor Regen wird durch die Fähigkeit des Produkts definiert, dich trocken zu halten."
- **"limited protection" → "gezielten Schutz"** — always reframe positively:
  → "offers limited wind protection" → "bietet gezielten Schutz bei Wind"
  → "offers limited water protection" → "bietet gezielten Schutz bei leichtem Regen"
  - Exception: insulation can keep "begrenzte Isolierung" when comparing products
- **Fit descriptions**: use active verbs, not noun constructions
  → "has a looser fit" → "sitzt es lockerer" (NOT "hat eine lockerere Passform")
- **Layering/combine advice**: use direct Du-form commands
  → "Combine with a stow away jacket/gilet or arm warmers" → "Kombiniere es bei kühleren Fahrten mit der Stow Away Jacket oder einer Weste bzw. Armlingen"
- **Weather/time phrases**: simplify naturally
  → "on crisp mornings" → "morgens wenn es kühler ist"
  → "when the temperature drops" → "wenn es kalt ist"
  → "suited for rides in mild to high temperatures" → "für Fahrten bei milden bis warmen Temperaturen geeignet"
- **Sizing advice**: Du-form, direct
  → "Wir empfehlen, eine Größe größer zu wählen als üblich."
- **Comfort/use case**: direct, benefit-first
  → "Comfort no matter conditions" → "Komfort bei allen Bedingungen"
  → "where comfort is paramount" → "bei denen Komfort an erster Stelle steht"

### Category descriptions (pnsCategory)
- Marketing-oriented, inviting tone
- "Explore our..." → "Entdecke unser..."
- More traditional German vocabulary acceptable here (vs product descriptions)
- "riding" → "Radfahren" / "Fahrten"
- "assembled by hand" → "von Hand gefertigt"

## 5. Never Translate

- Brand names: Pas Normal Studios, PNS
- Collection names: Mechanism, Essential, Escapism, Off-Race, T.K.O., STFR, Solitude, Balance, PAS, Mechanism Pro
- Collaboration names: "Pas Normal Studios x [Partner]"
- Product type terms in product names: Jersey, Bibs, Speedsuit, Skinsuit, Baselayer, Base Layer
- Color names: all in `data/protected-terms.json`
- Product names: all in `data/protected-terms.json`
- Technical brand materials: Coolmax®, Ecomade, Pertex, Polartec®, Yamamoto®, LOT 'O' DRY™, Ripstop, DWR, Mesh

## 6. Known Variations (Both Acceptable)

- "Breathability is defined as..." can be:
  - "Atmungsaktivität beschreibt die Fähigkeit..." (softer, preferred in newer docs)
  - "Atmungsaktivität wird durch die Fähigkeit definiert..." (literal definition)
- "Insulation is defined as..." uses "wird durch ... definiert" form
- "Wind/Water Protection is defined as..." uses "wird durch ... definiert" form consistently
- "outer layer" can be translated as "äußere Schicht" or omitted entirely depending on flow
- "Gilet" stays English in titles ("Jacken & Gilets"), but translated to "Weste" in descriptions
- "limited" in protection context → "gezielt" (positive reframe), but "begrenzt" acceptable for insulation comparisons

## 7. Type-Specific Rules Summary

| Doc type | Gender prefix | Title style | Description style |
|---|---|---|---|
| product | Männer/Frauen | English product name | Technical, Du-form |
| uberProduct | Männer/Frauen | English product name | Technical, Du-form, specs |
| feature.product | n/a | Translated German | Short translated text |
| pnsCategory | Herren/Damen | Fully translated German | Marketing, inviting |
| pnsCollection | n/a | NEVER translate | No descriptions |

## 8. Source Files (in this repo)

- Protected terms: `data/protected-terms.json`
- Language rules: `data/prompts.json` → `de.specialRules`
- User-editable glossary: `data/glossary.json`
