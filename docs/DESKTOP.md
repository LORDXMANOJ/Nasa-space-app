# Desktop app: what it runs on, and why

Astronaut Health Monitor ships as a desktop app for Windows, macOS and Linux (Electron). This page records the research behind the window size, the input methods and the Linux packages, with sources.

## The screens crew actually use

| Finding | Source | What we did |
|---|---|---|
| ISS crew use HP ZBook laptops; the station is moving from the ZBook Fury G2 to the ZBook G9, with the first batch launched in October 2025. Support computers for daily work run Windows. | [PC Gamer](https://www.pcgamer.com/hardware/gaming-laptops/theres-no-memory-crisis-in-space-as-astronauts-on-the-iss-are-getting-new-laptops-with-128-gb-of-ram-and-a-seriously-beefy-specs-sheet/), [HP Tech Takes](https://www.hp.com/us-en/shop/tech-takes/hp-zbooks-at-zero-gs), [TechRepublic](https://www.techrepublic.com/pictures/photos-from-the-thinkpad-to-the-ipad-the-tech-used-on-the-iss/) | Window opens at **1280 × 800**, the usable area of a 16-inch 16:10 laptop at Windows' common 150 % scaling. Minimum **800 × 600**. The layout was checked at 800×600, 1024×768, 1280×800, 1366×768, 1440×900, 1920×1200 and 2560×1440 with no sideways scrolling and no clipped text. |
| Orion (Artemis) has three display units driven mainly by a **cursor control device** on the armrest, because launch and entry forces can stop the crew reaching the screens. | [NASA: How to fly Orion](https://www.nasa.gov/missions/artemis/orion/how-to-fly-nasas-orion-spacecraft/), [Space.com](https://www.space.com/artemis-orion-spacecraft-digital-age-cockpit) | Everything works with a mouse, trackpad or cursor device, not only touch. |
| Crew Dragon's NASA crew were the first NASA astronauts to use **touchscreens** on a spacecraft (2020). | [Space.com](https://www.space.com/artemis-orion-spacecraft-digital-age-cockpit) | Touch-first targets (56 px, 64 px for the main action), on-screen number pad. |

We did not find published screen resolutions for these machines, so the window size is a reasoned default, not a claim about a specific panel.

## Linux: what space programmes run

| Finding | Source | Package |
|---|---|---|
| In 2013 the ISS laptop network (OpsLAN) moved from Windows XP to **Debian 6**; machines already on Scientific Linux (a Red Hat clone) moved too. | [The Register](https://www.theregister.com/2013/05/10/iss_linux_debian_deployment/), [Linux Foundation](https://training.linuxfoundation.org/solutions/corporate-solutions/success-stories/linux-foundation-training-prepares-the-international-space-station-for-linux-migration/), [Computer Weekly](https://www.computerweekly.com/blog/Open-Source-Insider/International-Space-Station-adopts-Debian-Linux-drops-Windows-Red-Hat-into-airlock) | `.deb` for Debian, Ubuntu, Mint |
| In 2026, **Red Hat Enterprise Linux 10.1** was deployed on a commercial micro data centre aboard the ISS; Lockheed Martin used RHEL for Orion flight-software simulation. | [The Register (2026)](https://www.theregister.com/off-prem/2026/05/12/red-hat-gives-rhel-101-the-boot-into-orbit/5238373), [Help Net Security](https://www.helpnetsecurity.com/2026/05/11/red-hat-enterprise-linux-voyager-deployment/), [Red Hat](https://www.redhat.com/en/resources/edge-computing-in-space-brief) | `.rpm` for RHEL, Rocky, Alma, Fedora |
| ESA's operations centre uses **SUSE Linux Enterprise Server** in its deep-space ground stations and spacecraft control centre. | [SUSE: European Space Agency](https://www.suse.com/success/european-space-agency/) | `.rpm` (installs with `zypper`) |
| NASA's core Flight System (cFS) builds and runs on Linux, including 64-bit PCs and ARM boards such as the Raspberry Pi; older build notes name CentOS, Red Hat, Debian, Ubuntu and SUSE. | [nasa/cFS on GitHub](https://github.com/nasa/cFS), [NASA cFS platform update (NTRS)](https://ntrs.nasa.gov/api/citations/20210000909/downloads/cFS_Platform_Updates-v5-final.pptx.pdf) | Every Linux package also comes for **ARM64** |
| Everything else | | **AppImage**: one file, no install |

We found no public source on the operating systems used on Artemis or Gateway crew computers.

## System requirements

- **Windows** 10 or 11, x64 or ARM64.
- **macOS** 12 or newer, Apple silicon or Intel (universal app).
- **Linux** x64 or ARM64 with glibc 2.28 or newer (Electron's baseline): for example RHEL / Rocky / Alma 8+, Debian 10+, Ubuntu 20.04+, SUSE 15+, Fedora 30+. The 2013-era Debian 6 is too old for any current browser engine.
- A GPU that supports WebGL for the 3D body; without it, the app uses the 2D body automatically.

## Install notes

- **Windows:** one installer for x64 and ARM64. It installs for the current user, so no administrator rights are needed; it asks where to install and adds Start-menu and desktop shortcuts. Not code-signed yet, so SmartScreen may warn: **More info → Run anyway**.
- **macOS:** open the .dmg and drag the app to Applications. Not signed or notarised yet: the first time, right-click the app and choose **Open**.
- **Debian / Ubuntu:** `sudo apt install ./AstronautHealthMonitor-Linux-<arch>.deb`
- **RHEL / Rocky / Alma / Fedora:** `sudo dnf install ./AstronautHealthMonitor-Linux-<arch>.rpm`
- **SUSE:** `sudo zypper install ./AstronautHealthMonitor-Linux-<arch>.rpm`
- **AppImage:** `chmod +x AstronautHealthMonitor-Linux-<arch>.AppImage` and run it. On Ubuntu 24.04 and newer, AppArmor can block AppImages built on Electron; use the `.deb` there.

## How the app is built

- `electron/main.cjs`: the window (resizable, remembered size, F11 full screen, `--fullscreen` flag), a locked-down renderer (sandboxed, no Node, context isolation), an `app://` origin that serves the built files offline, and links to the web opening in the system browser.
- `electron-builder.yml`: installer targets and fixed file names.
- `.github/workflows/release.yml`: builds on Windows, macOS and Ubuntu runners and attaches every installer to a GitHub Release when a tag such as `v1.0.0` is pushed.
- `site/index.html` + `.github/workflows/pages.yml`: the download page, which detects the visitor's system and reads the newest release's real file list from GitHub.
