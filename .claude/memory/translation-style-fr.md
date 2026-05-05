---
name: French Translation Style Guide
description: Style rules for EN→FR translation for Pas Normal Studios content. Built from native FR speaker review feedback on first translation pass.
type: reference
---

# French (FR) Translation Style Guide

> **PRIORITY ORDER:**
> 1. `data/protected-terms.json` — absolute blocklist, never translate these terms
> 2. `data/prompts.json` → `fr.specialRules` — official FR rules
> 3. This style guide — locked terms and learned patterns from native review feedback

## 1. Gender + Product Order — French Apparel Syntax

In FR, the **product type noun comes FIRST**, then collection/qualifier descriptors, then `Femme` or `Homme` as a suffix.

| English | French |
|---|---|
| Women's Essential Jersey | Jersey Essential Femme |
| Men's Essential Jersey | Jersey Essential Homme |
| Men's Mechanism Pro Long Sleeve Jersey | Jersey Mechanism Pro Long Sleeve Homme |
| Women's Mechanism Bibs | Bibs Mechanism Femme |
| Women's Mechanism Stow Away Gilet | Gilet Mechanism Stow Away Femme |

- **NOT** `Essential Jersey Femme` (English-order suffix — wrong)
- **NOT** `Femme Essential Jersey` (German-style prefix — wrong)
- The article (Le/La/Les) agrees with the **product type noun**, never the gender label
  - `le Jersey ...`, `les Bibs ...`, `le Speedsuit ...`
- Body text references can use the same pattern: `le Jersey Essential`, `la matière du Jersey Essential`

## 2. Tone & Voice

- **Formal "vous" form** throughout: `votre`, `vos`, `vous`
- **Premium, calm, refined** — like a high-end French sportswear brand
- **Active verbs preferred** for product descriptions
  - **Exception**: for "are constructed/made/designed without [X]", use the passive `sont conçus/conçues sans [X]`. This is more natural in FR apparel copy than over-active rephrasings like `se passent de [X]` (which sounds too casual for the premium tone).
- **Meaning-first**, never literal — reconstruct compound English phrases naturally

## 3. Locked Terminology

### Technical / fabric terms
| English | French | Notes |
|---|---|---|
| breathability | respirabilité | All spec descriptions |
| moisture-wicking | respirant / à séchage rapide / qui évacue la transpiration | NEVER `évacuation de l'humidité` |
| wind protection | protection contre le vent | NEVER `coupe-vent` as descriptive verb |
| water protection | protection contre la pluie | |
| insulation | isolation | |
| fabric / material | matière | Default; `tissu` only when more natural |
| fully-dyed | teint dans la masse | |
| pilling | boulochage | NEVER keep `pilling` English |
| elastic grippers / elastics | bandes élastiques / élastique | Context-dependent |
| cycling / road cycling | cyclisme / cyclisme sur route | |
| easy-care | facile d'entretien | |
| wrinkle-free | infroissable | |
| quick-drying | à séchage rapide | |
| limited (protection) | ciblé / idéal en cas de... | Positive reframe — NEVER `limité` for wind/water |
| road-optimised | optimisé pour la route | |
| low-intensity riding | sorties à faible intensité | |
| leisure rides | sorties loisirs | |
| social rides | sorties entre amis | |
| abrasion-resistant | résistant à l'abrasion | |

### Cycling event terms — kept English
| English | French | Notes |
|---|---|---|
| sportives | sportives | NEVER `cyclosportives` (sounds awkward to native speakers) |

### Zipper / construction terms
| English | French | Notes |
|---|---|---|
| YKK zipper | zip YKK | |
| puller (zipper component) | fermeture | NEVER `curseur` |
| semi auto-lock puller | fermeture semi-auto-lock | |
| guarded zip ends | extrémités de zip protégées | |
| are constructed without | sont conçus/conçues sans | Passive form preferred — see Tone & Voice exception |

### Layering / common terms
| English | French | Notes |
|---|---|---|
| outer layer | (omit / simplify) | Often unnecessary in FR |
| gilet | gilet | Already the natural French word — no swap needed |
| Baselayer | Baselayer | Stays English |

## 4. Cycling Idioms — DO NOT Translate Literally

EN cycling expressions that use bike-part metaphors (saddle, bars, bike) must be reconstructed naturally — direct translation produces unnatural French.

| English | French | Avoid |
|---|---|---|
| longer days in the saddle | longues sorties / longues journées de vélo | NEVER `longues journées en selle` |
| time in the saddle | temps de vélo / temps à rouler | NEVER `temps en selle` |
| on the bike | à vélo / lors de vos sorties | |

**General principle**: if the EN expression uses a bike-part metaphor, simplify to a literal cycling reference (`vélo`, `sortie`, `rouler`) or omit the metaphor.

## 5. Description Patterns

### Spec definition openings
For technical definitions ("X is defined as..."), use natural French structures, not literal:
- Breathability: *"La respirabilité permet à la matière d'évacuer la transpiration et de maintenir une sensation de confort au sec."*
- Wind: *"La protection contre le vent repose sur la capacité d'un produit à empêcher le vent de pénétrer la matière."*
- Water: *"La protection contre la pluie repose sur la capacité du produit à vous garder au sec."*
- Insulation: *"L'isolation repose sur la capacité de la matière à vous tenir chaud et à vous protéger du froid."*

### Positive reframing of "limited" (in product descriptions, not definitions)
- *"limited wind protection"* → *"protection ciblée par vent léger"*
- *"limited water protection"* → *"protection idéale en cas de pluie légère"*
- **Exception**: insulation comparisons can keep `reste limité en isolation`

### Time / weather phrases
- *"on chill mornings"* → *"le matin quand il fait plus frais"*
- *"when the temperature drops"* → *"quand il fait plus froid"*
- *"mild to warm temperatures"* → *"par temps doux à chaud"*

## 6. Never Translate

- Brand names: Pas Normal Studios, PNS
- Collection names: Mechanism, Essential, Escapism, Off-Race, T.K.O., STFR, Solitude, Balance, PAS, Mechanism Pro
- Collaboration names: "Pas Normal Studios x [Partner]"
- Product type terms in titles: Jersey, Bibs, Speedsuit, Skinsuit, Baselayer, Base Layer, Gilet
- Cycling event terms: sportives
- Color names: all in `data/protected-terms.json`
- Product names: all in `data/protected-terms.json`
- Technical brand materials: Coolmax®, Ecomade, Pertex, Polartec®, Yamamoto®, LOT 'O' DRY™, Ripstop, DWR, Mesh

## 7. Source Files (in this repo)

- Protected terms: `data/protected-terms.json`
- Language rules: `data/prompts.json` → `fr.specialRules`
- This style guide grows as native review feedback comes in.
