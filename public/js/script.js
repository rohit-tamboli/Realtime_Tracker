const socket = io();
console.log("hey");

// Check if geolocation is available
if (navigator.geolocation) {
  let timer;

  // Track user's position
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      clearTimeout(timer);

      // Send location data to the server after a short delay (debounce)
      timer = setTimeout(() => {
        socket.emit("send-location", { latitude, longitude });
      }, 1000); // 1-second delay to debounce
    },
    (error) => {
      // Error Handling for Geolocation
      if (error.code === error.PERMISSION_DENIED) {
        alert("Please allow location access to see other users.");
      } else if (error.code === error.TIMEOUT) {
        alert("Location request timed out. Please try again.");
      } else {
        console.error("Geolocation error: ", error);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
} else {
  alert("Geolocation is not supported by your browser.");
}

// Initialize the map
const map = L.map("map").setView([0, 0], 16);

// Set up OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Let's Start",
}).addTo(map);

const markers = {}; // Store markers for each user

// Listen for location updates from the server
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;
  map.setView([latitude, longitude]); // Center the map on the latest location

  // Update or add the user's marker on the map
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
});

// Handle user disconnect
socket.on("user-disconnect", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]); // Remove the user's marker
    delete markers[id]; // Delete the marker from storage
  }
});
