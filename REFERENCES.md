# References

Every external source, asset, font and library used, with what it was used for and its licence. Sources are cited and paraphrased; no text, images or video were copied.

**Status:** ✔ checked on 2026-11-14 by web search (the page exists and supports the claim). ◻ not yet checked; confirm before submission.

## Spaceflight context

| | Source | Used for |
|---|---|---|
| ✔ | NASA Human Research Program, *Hazards of human spaceflight*. https://www.nasa.gov/hrp/hazards | The five hazards and their effects (paraphrased) |
| ✔ | NASA, *Flight surgeons*. https://www.nasa.gov/directorates/esdmd/hhp/flight-surgeons | ISS crews have a private medical conference with flight surgeons, usually weekly |
| ✔ | Russell B.K. et al. (2023) The value of a spaceflight clinical decision support system for Earth-independent medical operations, *npj Microgravity*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10284846/ (also NASA Ames summary: https://www.nasa.gov/centers-and-facilities/ames/ames-science/ames-space-biosciences/a-clinical-decision-support-system-for-earth-independent-medical-operations) | NASA ExMC research on decision support for crews without real-time ground help: the context this prototype builds on |
| ✔ | Jones C.W. et al. (2022) Sleep deficiency in spaceflight is associated with degraded neurobehavioral functions and elevated stress in astronauts on six-month missions aboard the ISS, *Sleep*. https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197 | The Reaction Self Test (3-minute PVT every 4 days); ≤ 6 h sleep linked to slower reactions. Supports our sleep Watch limit below 6 h |
| ✔ | Zwart S.R. et al. (2014) Body mass changes during long-duration spaceflight, *Aviat Space Environ Med*. https://www.ncbi.nlm.nih.gov/pubmed/25197887 | SLAMMD and Russian BMMD; average in-flight mass loss of 2.8 to 4.4 % |
| ✔ | NASA OCHMO, *Radiation protection technical brief* (NASA-STD-3001). https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf | 600 mSv career effective-dose limit. Our 50 % / 80 % Watch / Act fractions are demo assumptions |
| ◻ | Zeitlin C. et al. (2013) Measurements of energetic particle radiation in transit to Mars on the Mars Science Laboratory, *Science* 340:1080. https://doi.org/10.1126/science.1235989 | ~1.8 mSv/day cruise dose rate (simulation input) |
| ✔ | Mars solar conjunction coverage (e.g. New Atlas, *NASA Mars missions stand down as the Sun blocks communications*). https://newatlas.com/space/nasa-mars-missions-pause-solar-conjunction | Roughly two weeks without commands during conjunction; up to ~22 min one-way signal time |
| ◻ | Minimum Earth–Mars one-way light time of ~3 min | Derived: closest approach ~54.6 million km ÷ speed of light ≈ 182 s. Add a NASA citation before submission |

## Health thresholds

| | Source | Used for |
|---|---|---|
| ✔ | American Heart Association, *Understanding blood pressure readings*. https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings | Watch at 130/80, Act at 140/90 |
| ✔ | American Heart Association, *When to call 911 about high blood pressure*. https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/when-to-call-911-for-high-blood-pressure | Very high blood pressure card (180/120) |
| ✔ | MedlinePlus, *Pulse oximetry*. https://medlineplus.gov/lab-tests/pulse-oximetry/ | Normal 95 to 100 %; contact a provider at 92 % or lower |
| ✔ | American Diabetes Association (2025) Standards of Care, *6. Glycemic Goals and Hypoglycemia*. https://diabetesjournals.org/care/article/48/Supplement_1/S128/157561/6-Glycemic-Goals-and-Hypoglycemia-Standards-of | Hypoglycaemia level 1 (below 70 mg/dL) and level 2 (below 54 mg/dL) |
| ◻ | American Heart Association, *Target heart rates*. https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates | Resting heart rate range |
| ◻ | American Heart Association, *Tachycardia* and *Bradycardia* pages. https://www.heart.org/en/health-topics/arrhythmia | Fast / slow heart-rate cards |
| ◻ | MedlinePlus, *Body temperature norms* (https://medlineplus.gov/ency/article/001982.htm) and *Fever* (https://medlineplus.gov/fever.html) | Temperature range; fever ≥ 38 °C (MedlinePlus pages use 100.4 °F / 38 °C) |
| ◻ | Watson N.F. et al. (2015) Recommended amount of sleep for a healthy adult (AASM/SRS), *J Clin Sleep Med*. https://doi.org/10.5664/jcsm.4758 | ≥ 7 h recommendation (context for the sleep limits) |
| ◻ | Shaffer F., Ginsberg J.P. (2017) An overview of heart rate variability metrics and norms, *Front. Public Health*. https://doi.org/10.3389/fpubh.2017.00258 | RMSSD as the HRV measure |
| ◻ | Basner M. et al. (2015) Development and validation of the Cognition test battery for spaceflight, *Aerosp Med Hum Perform*. https://doi.org/10.3357/AMHP.4314.2015 | Reaction-time testing in spaceflight. Our reaction limits are demo assumptions |

Body-mass ±5 % / ±10 % limits: **demo assumption**. A MedlinePlus "5 % unintended weight loss" rule could not be confirmed, so it is no longer cited.

## Devices

| | Name | Status in app |
|---|---|---|
| ✔ | Bio-Monitor smart shirt (Canadian Space Agency; Carré Technologies / Hexoskin). https://www.asc-csa.gc.ca/eng/multimedia/search/image/8166 | Named for heart rate, HRV and temperature feeds; linked only, nothing copied (non-U.S. Government site) |
| ✔ | rHEALTH ONE blood analyser, ISS demonstration May 2022. https://ntrs.nasa.gov/citations/20230001079 | Context only; not used in the MVP screens |
| ✔ | SLAMMD (Space Linear Acceleration Mass Measurement Device) | Named for the body-mass reading (simulated) |
| ◻ | ISS Ultrasound 2 | Named in the original brief; not used in the MVP screens |
| — | All other devices | Generic names marked "(simulated)" |

## Statistical methods

- Schäfer J., Strimmer K. (2005) A shrinkage approach to large-scale covariance matrix estimation. *Stat Appl Genet Mol Biol* 4(1). https://doi.org/10.2202/1544-6115.1175
- Page E.S. (1954) Continuous inspection schemes. *Biometrika* 41:100–115 (CUSUM). https://doi.org/10.1093/biomet/41.1-2.100
- Sen P.K. (1968) Estimates of the regression coefficient based on Kendall's tau. *JASA* 63:1379–1389 (Theil–Sen). https://doi.org/10.1080/01621459.1968.10480934
- Mahalanobis distance and the χ² quantile χ²(0.99, 7) = 18.475: standard results.

## Fonts and icons (bundled locally)

| Asset | Licence |
|---|---|
| Archivo (variable, wdth + wght), IBM Plex Sans, IBM Plex Mono via @fontsource | SIL Open Font License 1.1 |
| @phosphor-icons/react 2.1 icons | MIT |
| App icon (`public/icon.svg`) | Original, made for this project |
| 3D body: "Low-Poly Male Body" (`public/models/organs/body.glb`) | Tidominer, **CC-BY 4.0**, https://sketchfab.com/3d-models/low-poly-male-body-ddf11918aa8042cf9f43193f33611f47 |
| 3D heart: "Anatomically Correct Human Heart" (`heart.glb`) | Pigcraft, **CC-BY 4.0**, https://sketchfab.com/3d-models/anatomically-correct-human-heart-54fa880728d14c11afff78be8721620a |
| 3D lungs: "Lungs" (`lungs.glb`) | prasanth.k, **CC-BY 4.0**, https://sketchfab.com/3d-models/lungs-2706caba9679481bb809f141f87d7c14 |
| 3D skull: "ROJO-HS-1 Human Skull" (`skull.glb`) | Kent MORI (@rojohaku), **CC-BY 4.0**, https://sketchfab.com/3d-models/rojo-hs-1-human-skull-489fd613299942e4abe8477d7df0cfa7 |
| 3D stomach and intestines: "Human Organs" (`stomach.glb`, `intestines.glb`) | Suyanto, **CC-BY 4.0**, https://sketchfab.com/3d-models/human-organs-bced6b6ebded4845bcfb2496a6e6d35c |
| 3D spine: "Cauda Equina - 4-22" (`spine.glb`) | aandp, **CC-BY 4.0**, https://sketchfab.com/3d-models/cauda-equina-4-22-5d39455bf3c040a6ba3ab030b7b46890 |
| (all 3D models) | Simplified, textures removed, recoloured by status, rescaled and placed inside the body. Credited in the app (How it decides) and in `public/models/CREDITS.txt`. Not used: "Thorax and abdomen" by E-learning UMCG (CC-BY-NC-ND, no changes allowed) |
| 2D body: Hairline kernel (`public/hairline/kernel.js`) | From `@lucasmarkes/hairline` 0.5.1 by Lucas Marques, **MIT** (licence text in `public/hairline/LICENSE`), copied unchanged. https://github.com/lucasmarkes/hairline |

## Libraries (runtime)

react 19.3.1, react-dom 19.3.1, react-router-dom 7.18.5, zustand 5.1.0, recharts 3.10.1, three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9 (+ three-stdlib 2.36.1), zod 4.6.7: **MIT**. dexie 4.4.7: **Apache-2.0**.

## Tooling (build/test only)

vite 8.3.8, vitest 5.1.0, @vitejs/plugin-react 6.3.0, eslint 10.15.0, typescript-eslint 8.72.2, eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.5.7, prettier 3.10.1, globals 17.14.0: **MIT**. typescript 6.0.3: **Apache-2.0**.

## Concept video (`videos/concept-preview/`)

- Built with HyperFrames (HTML → MP4). All visuals are original and animated with GSAP (loaded by the HyperFrames toolchain at render time).
- Fonts: Montserrat and IBM Plex Mono (OFL 1.1).
- Narration: Kokoro-82M text-to-speech, voice `am_michael`, generated locally (Apache-2.0 model weights). ◻ Confirm voice licence terms before publishing.

## AI assistance

An AI coding assistant (Claude, by Anthropic) helped write the code, tests and documentation. The team reviewed and directed the work.
