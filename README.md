# Fuelwise

Fuelwise is a client-side calculator designed for Nigerian remote workers and freelancers who rely on a generator for electricity. It calculates what generator power costs you per working hour, helping you price your client work honestly and sustainably.

## Live Demo
[add link after deployment]

## The Problem
Generator costs are high and volatile for remote workers in Nigeria. When fuel prices shift or power outages persist for extended hours, the operational expense of staying online directly impacts freelance income unless factored into billing rates. Fuelwise provides clarity on baseline energy costs so freelancers never underprice their time.

## Key Features
1. **Guided Setup Wizard**: A 3-step setup flow capturing generator fuel burn rate (L/hr), weekly working schedule, and local fuel prices.
2. **Real-Time Cost Breakdown**: Immediate calculation of hourly power cost (hero number), daily fuel expense, and monthly fuel budget.
3. **Price Rise Stress-Testing**: An interactive 0%–50% fuel price slider demonstrating projected cost-per-hour changes live without recalculating base numbers.
4. **Protect Your Rate**: Enter your target freelance hourly rate to calculate the exact percentage absorbed by fuel, along with the adjusted quote required to protect your take-home pay.
5. **Quote Copy Button**: One-click copying of a client-ready quote disclosure sentence: `"My rate includes ₦X per hour for power costs."`
6. **Weekly Check-In**: A 10-second price update flow showing change in cost per hour (₦ and %) since the previous check-in.
7. **Cost Trend History**: Hand-built accessible SVG line chart with an alternative table view and auto-generated data insights.
8. **Real-Behaviour Gamification**:
   - **Weeks Tracked**: Milestone progression toward 4, 8, 12, and subsequent 12-week intervals.
   - **Forgiving Weekly Streak**: Non-punitive streak tracking that allows one missed week per streak before resetting.
   - **Earned Milestones**: 6 true milestone badges ("First number", "Price watcher", "Rate protector", "One month in", "Quarter tracked", "Backed up").
9. **Data Safety & Portability**: Full JSON backup export, schema-validated file restore, and recurring weekly calendar reminder (.ics) export.

## Forgiving Streak Rules
Streak counts consecutive weekly check-ins using Unix epoch weeks (`Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7))`):
- A streak is active if the latest check-in is in the current week or the week before.
- Consecutive weeks (gap of 1) extend the streak.
- One missed week is forgiven per streak (a gap of 2 is permitted once).
- A second missed week, or any gap of 3 or more, ends the streak without shaming or red alerts.

## Milestones
- **First number**: Completed initial setup and viewed your first hourly power cost.
- **Price watcher**: Tracked two check-ins with differing fuel prices.
- **Rate protector**: Viewed the rate protection result with an hourly rate entered.
- **One month in**: Logged 4 weekly check-ins.
- **Quarter tracked**: Logged 12 weekly check-ins.
- **Backed up**: Downloaded a JSON backup of your data.

## Running Tests
Tests run using Node's built-in `assert` module without any external packages:

```bash
node tests/calc.test.js
```

## Privacy & Data Safety Note
All calculations run entirely in your local browser using plain JavaScript. Your data is stored exclusively in your browser's `localStorage` (`fuelwise:v2`). No telemetry, analytics, or external network requests exist. Because all data resides in the local browser, clearing browser site data will reset your history—use the **Download my data** feature regularly to maintain offline backups.

## Honest Limits
- **User-supplied estimates**: Cost figures are estimates derived entirely from the numbers you supply.
- **No live fuel indexing**: The calculator does not fetch live market pump prices or track fuel station rates automatically.
- **Single power source**: The tool does not model grid power (disCo supply), solar inverters, or battery storage systems.

## Sources
[Sources will be filled in here]
