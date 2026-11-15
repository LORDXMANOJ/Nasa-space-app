**Astronaut Health Monitor, desktop app.** A one-minute daily health check for crew far from Earth that decides whether a problem can wait for Earth's reply. Runs fully offline. Prototype with simulated crew and data; it does not diagnose.

**Easiest:** open the [download page](https://lordxmanoj.github.io/Nasa-space-app/). It detects your system and offers the right file.

| Your computer | File | Notes |
|---|---|---|
| Windows 10 / 11 (Intel, AMD or ARM) | `AstronautHealthMonitor-Windows-Setup.exe` | One installer; it installs the build that matches your PC. No administrator rights needed. |
| macOS (Apple silicon or Intel) | `AstronautHealthMonitor-macOS.dmg` | One universal app. Not signed yet: the first time, right-click the app and choose **Open**. |
| Debian, Ubuntu, Mint | `AstronautHealthMonitor-Linux-amd64.deb` / `-arm64.deb` | `sudo apt install ./AstronautHealthMonitor-Linux-amd64.deb` |
| RHEL, Rocky, Alma, Fedora, SUSE | `AstronautHealthMonitor-Linux-x86_64.rpm` / `-aarch64.rpm` | `sudo dnf install ./…rpm` or `sudo zypper install ./…rpm` |
| Any other Linux | `AstronautHealthMonitor-Linux-x86_64.AppImage` / `-arm64.AppImage` | `chmod +x` the file, then run it. |

Windows shows a SmartScreen notice because the installer is not code-signed yet: choose **More info → Run anyway**.

**Updates.** From version 1.1.0 the app checks for a new version when the computer is online (you can turn this off in Settings). On Windows and Linux it downloads the update and installs it when you press **Restart and update**; your readings stay on the computer. On a Mac it opens the download page, because the app is not signed by Apple yet. Versions 1.0.0 and 1.0.1 cannot update themselves: install 1.1.0 once, over the old version, and later updates come in the app.
