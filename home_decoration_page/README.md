# Vue 3 + Vite

# Home Decoration E-commerce

## Configuration

### Simulation Timings (Demo vs Real Life)
You can toggle between **Demo Mode** (minutes) and **Real Life Mode** (hours) for order status progression.

1. Open `WebServer/app/controllers/orderController.js`.
2. Locate the line:
   ```javascript
   const USE_DEMO_TIMINGS = true; // or false
   ```
3. Set to `true` for **Demo Mode** (fast testing):
   - Preparation: ~1-3 minutes
   - Travel: ~2 minutes
   - Completion: 1 minute after delivery
4. Set to `false` for **Real Life Mode** (realistic):
   - Preparation: 2-4 hours (08:00 - 19:00 window)
   - Travel: Real driving time via OSRM/OpenStreetMap (falling back to Mock if API fails)
   - Delivery Window: 08:00 - 16:00 (Weekdays only)
   - Completion: 1 hour after delivery

> **Note**: After changing this file, you must **restart the backend server** (`npm start`) for changes to take effect.

## Project Setup
This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
