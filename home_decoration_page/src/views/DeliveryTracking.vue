<template>
  <div class="delivery-tracking-container">
    <div class="header">
      <h1>Delivery Tracking</h1>
      <p>Order #{{ orderId }}</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Locating your package...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else class="tracking-content">
      <!-- Main Status Card -->
      <div class="status-card">
        <div class="status-header">
          <div class="status-icon pulse">
            <i class="fas fa-shipping-fast"></i>
          </div>
          <div class="status-text">
            <h2>Order : {{ deliveryPlan.status }}</h2>
            <p class="eta-text">{{ friendlyEta }}</p>
          </div>
        </div>
        
        <!-- Live Map Embed (Leaflet) -->
        <div id="map" class="map-embed-container" v-if="primaryAllocation"></div>
      </div>

      <!-- Toggle Button (Moved Below Map) -->
      <button @click="toggleDetails" class="toggle-details-btn">
        {{ showDetails ? 'Hide Shipping Details' : 'Show Shipping Details' }}
      </button>

      <!-- Detailed Info Section (Moved Below Button) -->
      <transition name="slide-fade">
        <div v-if="showDetails" class="details-section">
            <div class="consolidation-info" v-if="deliveryPlan.consolidation && deliveryPlan.consolidation.isConsolidating">
                <h3><i class="fas fa-warehouse"></i> Multi-Warehouse Consolidation</h3>
                <p class="hub-info">All items are being consolidated at our Hub in <strong>{{ deliveryPlan.consolidation.hub.city }}</strong> before final delivery.</p>
                
                <div class="transfers-list">
                    <div v-for="(transfer, index) in deliveryPlan.consolidation.transfers" :key="index" class="transfer-card">
                        <div class="transfer-route">
                            <span class="location">{{ transfer.fromCity }}</span>
                            <i class="fas fa-arrow-right arrow"></i>
                            <span class="location">{{ transfer.toHub }} (Hub)</span>
                        </div>
                        <div class="transfer-status">
                            <span class="status-badge">{{ transfer.status }}</span>
                            <span class="time">{{ transfer.durationText }} transfer time</span>
                        </div>
                        <ul class="transfer-items">
                            <li v-for="item in transfer.items" :key="item.productId">
                                {{ item.quantity }}x Product #{{ item.productId }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Updated Final Leg Info / Timeline -->
            <div class="final-leg-info">
                <h3><i class="fas fa-truck"></i> {{ deliveryPlan.allocations[0].warehouseCity }} Warehouse to {{ deliveryPlan.allocations[0].destinationLabel }}</h3>
                
                <!-- Timeline Component -->
                <div class="timeline-container">
                    <div v-for="(event, index) in deliveryPlan.timeline" :key="index" 
                         class="timeline-item" 
                         :class="{ 'completed': event.isCompleted, 'active': !event.isCompleted && index === 0 }">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4 class="timeline-title">{{ event.status }}</h4>
                            <p class="timeline-desc">{{ event.description }}</p>
                            <span class="timeline-time">{{ new Date(event.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) }}</span>
                            <!-- Estimated Travel Time (Visible only for Delivered event) -->
                            <p v-if="event.status === 'Delivered'" class="travel-time-highlight">
                                <i class="fas fa-hourglass-half"></i> Travel Time: <strong>{{ deliveryPlan.allocations[0].durationText }}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </transition>

      <button @click="goBack" class="back-btn">Back to Orders</button>
    </div>
  </div>
</template>

<script>
import OrderService from "../services/order.service";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default {
  name: "DeliveryTracking",
  data() {
    return {
      orderId: this.$route.params.id,
      deliveryPlan: null,
      loading: true,
      error: null,
      map: null,
      showDetails: false
    };
  },
  computed: {
    primaryAllocation() {
      if (this.deliveryPlan && this.deliveryPlan.allocations.length > 0) {
        return this.deliveryPlan.allocations[0];
      }
      return null;
    },
    friendlyEta() {
      if (!this.primaryAllocation) return "Pending update...";
      
      const etaDate = new Date(this.primaryAllocation.eta);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = etaDate.toDateString() === today.toDateString();
      const isTomorrow = etaDate.toDateString() === tomorrow.toDateString();
      
      let dayString = etaDate.toLocaleDateString(undefined, { weekday: 'long' });
      if (isToday) dayString = "Today";
      if (isTomorrow) dayString = "Tomorrow";

      const hour = etaDate.getHours();
      const minute = etaDate.getMinutes();
      const timeString = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Change text for Delivered/Completed
      if (this.deliveryPlan.status === 'Delivered' || this.deliveryPlan.status === 'Completed') {
          if (isToday) return `Delivered today at ${timeString}`;
          return `Delivered on ${etaDate.toLocaleDateString()} at ${timeString}`;
      }

      const label = "Estimated delivery:";
      
      // Check for Range (Real Mode)
      if (this.deliveryPlan.windowStart && this.deliveryPlan.windowEnd) {
          const start = new Date(this.deliveryPlan.windowStart);
          const end = new Date(this.deliveryPlan.windowEnd);
          const now = new Date(); // Fix: Define now
          
          const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const isWindowToday = start.getDate() === now.getDate() && start.getMonth() === now.getMonth();
          const isWindowTomorrow = start.getDate() === now.getDate() + 1;
          
          if (isWindowToday) return `${label} Today between ${startStr} - ${endStr}`;
          if (isWindowTomorrow) return `${label} Tomorrow between ${startStr} - ${endStr}`;
          return `${label} ${start.toLocaleDateString()} ${startStr} - ${endStr}`;
      }

      if (isToday) {
          return `${label} Today at ${timeString}`;
      } else if (isTomorrow) {
          return `${label} Tomorrow at ${timeString}`;
      }
      
      // Fallback for future dates
      return `${label} ${dayString} at ${timeString}`;
    }
  },
  async created() {
    try {
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await OrderService.trackDelivery(this.orderId);
      this.deliveryPlan = response.data;
      this.loading = false;
      
      // Initialize map after DOM update
      this.$nextTick(() => {
        this.initMap();
      });
    } catch (err) {
      console.error(err);
      this.error = `Failed to load delivery details. ${err.message || err}`;
      this.loading = false;
    }
  },
  methods: {
    goBack() {
      this.$router.push("/profile");
    },
    async initMap() {
      if (!this.primaryAllocation) return;

      const warehouseCity = this.primaryAllocation.warehouseCity;
      const customerAddr = this.primaryAllocation.destinationAddress || "Paris, France"; 
      console.log("Tracking Address:", customerAddr); // Debug
      
      // Construct specific warehouse address if available, otherwise fallback to city
      let warehouseAddr = `${warehouseCity}, France`;
      if (this.primaryAllocation.warehouseAddressLine1) {
          warehouseAddr = `${this.primaryAllocation.warehouseAddressLine1}, ${this.primaryAllocation.warehousePostalCode} ${warehouseCity}, ${this.primaryAllocation.warehouseCountry}`;
      }
      console.log("Warehouse Address:", warehouseAddr); // Debug 

      // 1. Initialize Map
      this.map = L.map('map').setView([46.603354, 1.888334], 6); // Center of France

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      // Custom Local Icons (User Provided)
      // Fix Anchors to Center [16,16] since these are square images, prevents jumping on zoom
      const warehouseIcon = L.icon({
          iconUrl: '/icons/warehouse.png', 
          iconSize: [32, 32],
          iconAnchor: [16, 16], 
          popupAnchor: [0, -20]
      });

      const homeIcon = L.icon({
          iconUrl: '/icons/home.png', 
          iconSize: [32, 32],
          iconAnchor: [16, 16], 
          popupAnchor: [0, -20]
      });

      const truckIcon = L.icon({
          iconUrl: '/icons/truck.png', 
          iconSize: [40, 40],
          iconAnchor: [20, 20] 
      });

      // 2. Geocode Origin (Warehouse)
      const originCoords = await this.geocode(warehouseAddr);
      // 3. Geocode Destination (Customer)
      let destCoords = await this.geocode(customerAddr);

      // Safety check
      if (!originCoords || !destCoords) return;

      // Overlap Check
      if (Math.abs(originCoords[0] - destCoords[0]) < 0.0001 && 
          Math.abs(originCoords[1] - destCoords[1]) < 0.0001) {
          destCoords = [destCoords[0] + 0.005, destCoords[1] + 0.005]; 
      }

      // --- VISIBILITY LOGIC per Status ---
      const plan = this.deliveryPlan;
      const status = plan.status;
      const isEnRoute = status === "En Route";
      const isDelivered = status === "Delivered";
      const isCompleted = status === "Completed";

      // 1. Delivered/Completed State: Show ONLY exact delivery location
      if (isDelivered || isCompleted) {
          L.marker(destCoords, { icon: homeIcon }).addTo(this.map)
              .bindPopup(`<b>Delivery Location</b><br>${customerAddr}`)
              .openPopup();
          
          this.map.setView(destCoords, 14); // Zoom in on home
          return; 
      }

      // 2. Active State (Pending, Preparing, En Route)
      // Add Markers
      L.marker(originCoords, { icon: warehouseIcon }).addTo(this.map)
          .bindPopup(`<b>Warehouse</b><br>${warehouseCity}`);

      L.marker(destCoords, { icon: homeIcon }).addTo(this.map)
          .bindPopup(`<b>Delivery Location</b><br>${customerAddr}`);

      // Fit Bounds
      const group = new L.featureGroup([
          L.marker(originCoords),
          L.marker(destCoords)
      ]);
      this.map.fitBounds(group.getBounds().pad(0.2));

      // 3. Draw Route (Simulated Straight Line + Curve for visual)
      // We removed the OSRM fetch to prevent Network Errors / Simulated Mode.
      // We'll create a simple curved path for better visuals than a straight line.
      // 3. Draw Route (Real Road Path via OSRM)
      const routeCoords = await this.fetchRoadRoute(originCoords, destCoords);

      // 4. Draw Static Route if NOT En Route (e.g. Preparing)
      if (!isEnRoute) {
          L.polyline(routeCoords, { color: '#bdc3c7', weight: 4, dashArray: '10, 10', opacity: 0.7 }).addTo(this.map);
      }

      // 5. LIVE SIMULATION (Truck -> Home Line)
      if (isEnRoute && plan.departureTime) {
          const departure = new Date(plan.departureTime).getTime();
          const durationSec = this.primaryAllocation.durationValue || 120; // 2 mins demo fallback
          const arrival = departure + (durationSec * 1000);
          
          // Use the simulated route for truck movement
          const truckMarker = L.marker(routeCoords[0], { icon: truckIcon }).addTo(this.map);
          const routePolyline = L.polyline([], {
              color: 'blue', 
              weight: 4, 
              opacity: 0.7
          }).addTo(this.map);

          this.intervalId = setInterval(() => {
              const now = Date.now();
              let progress = (now - departure) / (arrival - departure);
              if (progress < 0) progress = 0;
              if (progress > 1) progress = 1;

              const totalPoints = routeCoords.length;
              const pointIndex = Math.floor(progress * (totalPoints - 1));
              const nextPointIndex = Math.min(pointIndex + 1, totalPoints - 1);
              
              const p1 = routeCoords[pointIndex];
              const p2 = routeCoords[nextPointIndex];

              const segmentProgress = (progress * (totalPoints - 1)) % 1;
              const currentLat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
              const currentLng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
              
              const truckPos = [currentLat, currentLng];
              truckMarker.setLatLng(truckPos);

              // Update Blue Line: From Truck Position -> End of Route
              const remainingPath = [truckPos, ...routeCoords.slice(nextPointIndex)];
              routePolyline.setLatLngs(remainingPath);
              
              if (progress >= 1) {
                  clearInterval(this.intervalId);
              }
          }, 1000);
      }
    },
    beforeUnmount() {
        if (this.intervalId) clearInterval(this.intervalId);
    },
    // Safe Geocoding with Timeout & Retry
    async geocode(query, retries = 1) {
        // 1. Try Real API (Nominatim) for accuracy
        for (let i = 0; i <= retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased 5s Timeout

                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) throw new Error("Network response was not ok");

                const data = await response.json();
                if (data && data.length > 0) {
                    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                }
            } catch (e) {
                console.warn(`Geocoding attempt ${i + 1} failed:`, e);
                // Wait small delay before retry
                if (i < retries) await new Promise(r => setTimeout(r, 1000));
            }
        }

        // 2. Fallback Simulation (if API fails after retries)
        console.warn("All geocoding attempts failed. Using fallback for:", query);
        const q = query.toLowerCase();
        
        // Specific Fallbacks
        if (q.includes('villepinte')) return [48.9634, 2.5469];
        if (q.includes('paris')) return [48.8566, 2.3522];
        if (q.includes('lyon')) return [45.7640, 4.8357];
        if (q.includes('marseille')) return [43.2965, 5.3698];
        if (q.includes('lille')) return [50.6292, 3.0573];
        if (q.includes('bordeaux')) return [44.8378, -0.5792];
        if (q.includes('nice')) return [43.7102, 7.2620];
        if (q.includes('toulouse')) return [43.6047, 1.4442];

        // Default Center
        return [48.8566, 2.3522]; 
    },
    // Generate some intermediate points for a curved line
    getSimulatedRoute(start, end) {
        const points = [];
        const numPoints = 50;
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const lat = start[0] * (1-t) + end[0] * t;
            const lng = start[1] * (1-t) + end[1] * t;
            points.push([lat, lng]);
        }
        return points;
    },
    async fetchRoadRoute(start, end) {
        try {
            // OSRM expects lon,lat; Leaflet uses lat,lon
            const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
               // Flip [lon, lat] to [lat, lon] for Leaflet
               return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
        } catch (e) {
            console.warn("OSRM Failed, using fallback:", e);
        }
        // Fallback to straight line
        return this.getSimulatedRoute(start, end);
    },
    toggleDetails() {
        this.showDetails = !this.showDetails;
    }
  }
};
</script>

<style scoped>
.delivery-tracking-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 5px;
}

.loading-state {
  text-align: center;
  padding: 50px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #27ae60;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

.status-header {
  padding: 30px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(to right, #ffffff, #f9f9f9);
}

.status-icon {
  width: 60px;
  height: 60px;
  background: #e8f5e9;
  color: #27ae60;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-right: 20px;
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(39, 174, 96, 0); }
  100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
}

.status-text h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.eta-text {
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.map-embed-container {
  width: 100%;
  height: 450px;
  background: #eee;
  z-index: 1; /* Ensure map is below dropdowns if any */
}

/* Leaflet Overrides */
:deep(.leaflet-control-attribution) {
  font-size: 0.7rem;
}

.back-btn {
  display: block;
  width: 100%;
  max-width: 200px;
  margin: 30px auto 0;
  background: #2c3e50;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
}

.back-btn:hover {
  background: #34495e;
  transform: translateY(-2px);
}

.toggle-details-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  margin-bottom: 20px;
  font-weight: 600;
  width: 100%;
  transition: background 0.3s;
}

.toggle-details-btn:hover {
  background: #2980b9;
}

.details-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.consolidation-info h3, .final-leg-info h3 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hub-info {
  margin-bottom: 15px;
  color: #555;
  font-style: italic;
}

.transfer-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid #f39c12;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.transfer-route {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
}

.arrow {
  color: #7f8c8d;
}

.transfer-status {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.status-badge {
  background: #fae5d3;
  color: #d35400;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.transfer-items {
  margin: 0;
  padding-left: 20px;
  font-size: 0.85rem;
  color: #555;
}

.final-leg-info {
  margin-top: 20px;
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
}

/* Timeline Styles */
.timeline-container {
  margin-top: 15px;
  padding-left: 10px;
  border-left: 2px solid #e0e0e0;
  margin-left: 10px;
}

.timeline-item {
  position: relative;
  padding-left: 20px;
  margin-bottom: 25px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: -6px; /* Center on border line */
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #bdc3c7;
  border: 2px solid white;
}

.timeline-item.completed .timeline-marker {
  background: #27ae60;
  box-shadow: 0 0 0 2px rgba(39, 174, 96, 0.2);
}

.timeline-content {
  background: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0;
}

.timeline-title {
  margin: 0 0 5px 0;
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 600;
}

.timeline-desc {
  margin: 0 0 5px 0;
  font-size: 0.85rem;
  color: #7f8c8d;
}

.timeline-time {
  font-size: 0.75rem;
  color: #95a5a6;
  display: block;
}

.estimated-travel {
    margin-top: 20px;
    background: #e8f6f3;
    padding: 10px;
    border-radius: 6px;
    color: #16a085;
    text-align: center;
}

/* Transition Effects */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
