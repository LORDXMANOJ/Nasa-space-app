# References

Every external source, asset, font and library used, with what it was used for and its licence. Links are cited and paraphrased; no text, images or video were copied from them.

> **TODO before submission:** open every link below, confirm it resolves and still supports the claim, and record the check date. Links marked **(verify)** were written from memory and have not been checked yet.

## Health thresholds and context

| Source | Used for | Notes |
|---|---|---|
| American Heart Association, *Understanding blood pressure readings*. https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings | BP Watch/Act limits (130/80, 140/90) | (verify) |
| American Heart Association, *Hypertensive crisis*. https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/hypertensive-crisis-when-you-should-call-911-for-high-blood-pressure | BP crisis card (180/120) | (verify) |
| American Heart Association, *Target heart rates*. https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates | Resting HR range | (verify) |
| American Heart Association, *Tachycardia* / *Bradycardia* pages. https://www.heart.org/en/health-topics/arrhythmia | Fast / slow heart-rate cards | (verify) |
| Shaffer F., Ginsberg J.P. (2017) An overview of heart rate variability metrics and norms. *Front. Public Health*. https://doi.org/10.3389/fpubh.2017.00258 | RMSSD as the HRV measure | |
| MedlinePlus, *Pulse oximetry*. https://medlineplus.gov/lab-tests/pulse-oximetry/ | SpO₂ normal range | (verify) |
| MedlinePlus, *Body temperature norms*. https://medlineplus.gov/ency/article/001982.htm and *Fever*. https://medlineplus.gov/fever.html | Temperature range, fever ≥ 38 °C | (verify) |
| MedlinePlus, *Weight loss, unintentional*. https://medlineplus.gov/ency/article/003107.htm | ±5 % / ±10 % body-mass change | (verify) |
| Watson N.F. et al. (2015) Recommended amount of sleep for a healthy adult (AASM/SRS). *J Clin Sleep Med*. https://doi.org/10.5664/jcsm.4758 | ≥ 7 h sleep recommendation | Our Watch < 6 h is a demo assumption |
| American Diabetes Association, *Standards of Care in Diabetes*. https://professional.diabetes.org/standards-of-care | Fasting glucose range, hypoglycaemia levels 70 / 54 mg/dL | (verify) |
| Basner M. et al. (2015) Development and validation of the Cognition test battery for spaceflight. *Aerosp Med Hum Perform*. https://doi.org/10.3357/AMHP.4314.2015 | Reaction-time testing in spaceflight | Our reaction limits are demo assumptions |
| NASA, *NASA-STD-3001 Space Flight Human-System Standard*. https://www.nasa.gov/ochmo/human-spaceflight-and-aviation-standards/ | 600 mSv career dose limit | (verify) The 50 % / 80 % Watch/Act fractions are ours |
| Zeitlin C. et al. (2013) Measurements of energetic particle radiation in transit to Mars on the Mars Science Laboratory. *Science* 340:1080. https://doi.org/10.1126/science.1235989 | ~1.8 mSv/day cruise dose rate (simulation input) | |
| NASA Human Research Program, *Hazards of human spaceflight*. https://www.nasa.gov/hrp/hazards/ | The five hazards and their effects | (verify) Paraphrased |

## Devices

| Name | Status in app |
|---|---|
| Bio-Monitor smart shirt (Canadian Space Agency). https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp | Named (heart rate, temperature); linked only, nothing copied (non-U.S. Government site). (verify) |
| ISS Ultrasound 2, rHEALTH ONE | Named in the brief; not used in the MVP screens |
| All other devices | Generic names marked "(simulated)". **TODO:** verify the ISS body-mass device name (SLAMMD) before naming it |

## "How astronauts are monitored today" (in-app note)

Claims about ISS private medical conferences, scheduled exams and research sensors. **TODO:** add and verify a NASA source for each before submission.

## Statistical methods

- Schäfer J., Strimmer K. (2005) A shrinkage approach to large-scale covariance matrix estimation. *Stat Appl Genet Mol Biol* 4(1). https://doi.org/10.2202/1544-6115.1175
- Page E.S. (1954) Continuous inspection schemes. *Biometrika* 41:100–115 (CUSUM). https://doi.org/10.1093/biomet/41.1-2.100
- Sen P.K. (1968) Estimates of the regression coefficient based on Kendall's tau. *JASA* 63:1379–1389 (Theil–Sen). https://doi.org/10.1080/01621459.1968.10480934
- Mahalanobis distance and the χ² quantile χ²(0.99, 7) = 18.475: standard results.

## Fonts and icons (bundled locally)

| Asset | Licence |
|---|---|
| Public Sans 5.3.0 (UI), IBM Plex Mono 5.3.0 (data preview only) via @fontsource | SIL Open Font License 1.1 |
| lucide-react 1.73.0 icons | ISC |
| App icon (`public/icon.svg`) | Original, made for this project |
| 3D body | Procedural (three.js capsules and spheres), original; no third-party model |

## Libraries (runtime)

react 19.3.1, react-dom 19.3.1, react-router-dom 7.18.5, zustand 5.1.0, recharts 3.10.1, three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9 (+ three-stdlib 2.36.1), zod 4.6.7: **MIT**. dexie 4.4.7: **Apache-2.0**.

## Tooling (build/test only)

vite 8.3.8, vitest 5.1.0, @vitejs/plugin-react 6.3.0, eslint 10.15.0, typescript-eslint 8.72.2, eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.5.7, prettier 3.10.1, globals 17.14.0: **MIT**. typescript 6.0.3: **Apache-2.0**.

## Concept video (`videos/concept-preview/`)

- Built with HyperFrames (HTML → MP4). All visuals are original and animated with GSAP (loaded by the HyperFrames toolchain at render time).
- Fonts: Montserrat and IBM Plex Mono (OFL 1.1).
- Narration: Kokoro-82M text-to-speech, voice `am_michael`, generated locally (Apache-2.0 model weights). **TODO:** confirm voice licence terms before publishing.

## AI assistance

An AI coding assistant (Claude, by Anthropic) helped write the code, tests and documentation. The team reviewed and directed the work.
