# Fuelwise

Fuelwise is a client-side calculator designed for Nigerian remote workers and freelancers who rely on a generator for electricity. It calculates what generator power costs you per working hour, helping you price your client work honestly and sustainably.

## Live Demo
[add link after deployment]

## The Problem
Generator costs are high and volatile for remote workers in Nigeria. When fuel prices shift or power outages persist for extended hours, the operational expense of staying online directly impacts freelance income unless factored into billing rates.

## How to Use It
1. **Enter generator specs**: Provide your generator's burn rate in litres per hour (check the generator's label or manual) and the number of hours it runs each day.
2. **Enter pricing and work hours**: Fill in your local fuel price per litre (₦), your working days per month, and your working hours per day.
3. **Inspect your rates and price shocks**: Review your daily, monthly, and hourly power costs, and adjust the price rise slider (0% to 50%) to stress-test your hourly rate against future price hikes.

## The Formula
- **Daily Fuel Cost**: Multiply litres consumed per hour by the hours the generator runs per day and the fuel price per litre.
- **Monthly Fuel Cost**: Multiply daily fuel cost by the number of working days per month.
- **Cost per Work Hour**: Divide monthly fuel cost by total working hours in the month (working days per month multiplied by working hours per day).
- **Projected Price Rise**: Scale the per-hour cost by the selected fuel price increase percentage (`price × (1 + rise ÷ 100)`).

## Running Tests
Tests use Node's built-in assertion module without any external dependencies:

```bash
node tests/calc.test.js
```

## Privacy
Your numbers stay in your browser. Calculations run completely client-side in plain JavaScript, and saved data is stored only in your browser's `localStorage`. No data, analytics, or telemetry are ever sent anywhere.

## Honest Limits
- **User-supplied estimates**: Cost figures are estimates derived entirely from the numbers you supply.
- **No live fuel indexing**: The calculator does not fetch live market pump prices or track fuel station rates automatically.
- **Single power source**: The tool does not model grid power (disCo supply), solar inverters, or battery storage systems.

## Sources
[Sources will be filled in here]
