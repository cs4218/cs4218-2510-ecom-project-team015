# Load Testing (using k6)

Load tests written by Ujjwal Gaurav

## How to install k6

**macOS**

```bash
brew install k6
```

**Ubuntu/Debian**

```bash
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update && sudo apt install k6
```

**Windows (Chocolatey)**

```powershell
choco install k6
```

## File Structure

```
load-testing/
  main.js          
  load.smoke.js    
  load.normal.js   
  load.peak.js     
  README.md
# After runs: smoke-summary.json / normal-summary.json / peak-summary.json
```

## Run 

**npm (recommended)**

```json
{
  "scripts": {
    "load:smoke":  "k6 run --summary-export load-testing/smoke-summary.json  load-testing/load.smoke.js",
    "load:normal": "k6 run --summary-export load-testing/normal-summary.json load-testing/load.normal.js",
    "load:peak":   "k6 run --summary-export load-testing/peak-summary.json load-testing/load.peak.js"
  }
}
```

```bash
npm run dev
npm run load:smoke
npm run load:normal
npm run load:peak
```

**Direct**
```bash
npm run dev
```
then 

```bash
k6 run --summary-export load-testing/normal-summary.json load-testing/load.normal.js
```

## Scenarios 

* **Smoke:** browse `1 rps` 90s; cart `0.5 rps` 90s. Checkout forced on.
* **Normal:** browse `4 rps` 15m; cart `1.5 rps` 15m.
* **Peak:** browse `12 rps` 8m; cart `5 rps` 8m. (Bodies discarded to save mem.)

## SLAs & Thresholds

* Errors: **Normal <2%**, **Peak <5%**
* p95 request: **browse ≤2s (≤2.5s peak)**, **cart ≤4s (≤5s peak)**
* p95 iteration (end‑to‑end incl. think‑time): **Normal** browse ≤8s, cart ≤12s; **Peak** browse ≤9s, cart ≤13s
* Scheduling: **dropped_iterations == 0**
* Coverage counters (`branch_*`): visible in summary; Smoke requires checkout>0, Normal requires quick/standard>0, Peak requires checkout/abandon/merge>0.

## Outputs

* JSON summaries:

  * `load-testing/smoke-summary.json`
  * `load-testing/normal-summary.json`
  * `load-testing/peak-summary.json`

## Note

I have used **ChatGPT** to write some of the script for load testing.