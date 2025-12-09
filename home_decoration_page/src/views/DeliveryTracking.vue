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
            <p class="eta-text">Estimated delivery: {{ friendlyEta }}</p>
          </div>
        </div>
        
        <!-- Live Map Embed (Leaflet) -->
        <div id="map" class="map-embed-container" v-if="primaryAllocation"></div>
      </div>

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
      map: null
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
      let timeOfDay = "during the day";
      
      if (hour < 12) {
          timeOfDay = "morning (10am - 11am)";
      } else if (hour < 17) {
          timeOfDay = "afternoon (2pm - 4pm)";
      } else {
           timeOfDay = "evening";
      }

      return `${dayString} ${timeOfDay}`;
    }
  },
  async created() {
    try {
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
      this.error = "Failed to load delivery details.";
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
      // Use the actual address from backend, or fallback to warehouse city if missing
      const customerAddr = this.primaryAllocation.destinationAddress || "Paris, France"; 
      console.log("Tracking Address:", customerAddr); // Debug
      const warehouseAddr = `${warehouseCity}, France`; 

      // 1. Initialize Map
      this.map = L.map('map').setView([46.603354, 1.888334], 6); // Center of France

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      // Custom Image Icons (Using Icons8)
      // Fix Anchors to Center [16,16] since these are square images, prevents jumping on zoom
      const warehouseIcon = L.icon({
          iconUrl: 'https://img.icons8.com/fluency/48/warehouse-1.png', 
          iconSize: [32, 32],
          iconAnchor: [16, 16], 
          popupAnchor: [0, -20]
      });

      const homeIcon = L.icon({
          iconUrl: 'https://img.icons8.com/fluency/48/home.png', 
          iconSize: [32, 32],
          iconAnchor: [16, 16], 
          popupAnchor: [0, -20]
      });

      const truckIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/759/759960.png', 
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

      // 3. Draw Route (Try OSRM for Real Road, fallback to straight line)
      let routeCoords = [originCoords, destCoords]; // Default straight
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoords[1]},${originCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const json = await res.json();
        if (json.routes && json.routes.length > 0) {
            // OSRM returns [lon, lat], Leaflet needs [lat, lon]
            const coordinates = json.routes[0].geometry.coordinates;
            routeCoords = coordinates.map(c => [c[1], c[0]]);
        }
      } catch (e) {
          console.warn("OSRM routing failed, using straight line", e);
      }

      // --- VISIBILITY LOGIC per Status ---
      const plan = this.deliveryPlan;
      const status = plan.status;
      const isEnRoute = status === "En Route";
      const isDelivered = status === "Delivered";

      // Show Route Line ONLY if En Route or Delivered
      if (isEnRoute || isDelivered) {
          L.polyline(routeCoords, {
              color: 'blue', 
              weight: 4, 
              opacity: 0.7
          }).addTo(this.map);
      }

      // --- LIVE SIMULATION along the Route ---
      // Show Truck ONLY if En Route
      if (isEnRoute && plan.departureTime) {
          const departure = new Date(plan.departureTime).getTime();
          const durationSec = this.primaryAllocation.durationValue || 120; // 2 mins demo fallback
          const arrival = departure + (durationSec * 1000);
          
          const truckMarker = L.marker(routeCoords[0], { icon: truckIcon }).addTo(this.map);

          this.intervalId = setInterval(() => {
              const now = Date.now();
              let progress = (now - departure) / (arrival - departure);
              if (progress < 0) progress = 0;
              if (progress > 1) progress = 1;

              // Interpolate along the REAL route path
              // Calculate total points index
              const totalPoints = routeCoords.length;
              const pointIndex = Math.floor(progress * (totalPoints - 1));
              const nextPointIndex = Math.min(pointIndex + 1, totalPoints - 1);
              
              const p1 = routeCoords[pointIndex];
              const p2 = routeCoords[nextPointIndex];

              // Local interpolation
              const segmentProgress = (progress * (totalPoints - 1)) % 1;
              const currentLat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
              const currentLng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
              
              truckMarker.setLatLng([currentLat, currentLng]);
              
              if (progress >= 1) clearInterval(this.intervalId);
          }, 1000);
      }
    },
    beforeUnmount() {
        if (this.intervalId) clearInterval(this.intervalId);
    },
    async geocode(query) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (e) {
        console.error("Geocoding failed", e);
      }
      return null;
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

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
