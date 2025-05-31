// Global variables
let map;
let marker;
let selectedLatLng;
let currentUserRole = ''; // From your original code

// Utility function to get user role (from your original code)
function getUserRole() {
    const storedRole = sessionStorage.getItem('userRole');
    return storedRole || currentUserRole;
}

// Initialize calendar day click listeners (from your original code)
function initializeCalendarDayListeners() {
    const calendarDays = document.querySelectorAll('.day');
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            const dayNumber = this.textContent;
            const calendarHeader = document.querySelector('.calendar-header h2');
            if (!calendarHeader) {
                console.error("Calendar header for month/year not found.");
                return;
            }
            const monthYear = calendarHeader.textContent;
            const visitDate = `${monthYear} ${dayNumber}`; // Consider formatting for consistency
            formpopup(visitDate, "9 AM"); // Default time, or make it dynamic
        });
    });
}

// Open form popup (from your original code, made slightly more robust)
function formpopup(cellDate, cellTime) {
    const modal = document.getElementById('visit-modal');
    if (!modal) {
        console.error("Visit modal element not found!");
        return;
    }
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('blur-background');
    }

    const visitDateInput = document.getElementById('visit-date');
    const visitTimeInput = document.getElementById('visit-time');

    if (cellDate && visitDateInput) {
        visitDateInput.value = cellDate;
    }
    if (cellTime && visitTimeInput) {
        visitTimeInput.value = cellTime;
    }
    modal.style.display = 'flex';
}

// Close visit form modal (robust version)
function closeModal() {
    const modal = document.getElementById('visit-modal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error('In closeModal: Element with ID "visit-modal" not found.');
    }

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.remove('blur-background');
    } else {
        // console.warn('In closeModal: Element with class "main-content" not found to remove blur.');
    }

    const visitForm = document.getElementById('visit-form');
    if (visitForm) {
        visitForm.reset(); // This will reset all form fields to their default values
         // Also reset the location field if it was populated by the map, or clear it.
        const locationInput = document.getElementById('visit-location');
        if(locationInput) locationInput.value = '';

        // Reset status dropdown to default (e.g., "Planned") and hide completed notes
        const statusSelect = document.getElementById('visit-status');
        if(statusSelect) statusSelect.value = 'Planned'; // Or your default value

        const visitCompletedInput = document.getElementById('visits-completed');
        if (visitCompletedInput) {
            visitCompletedInput.style.display = 'none';
        }

    } else {
        console.error('In closeModal: Element with ID "visit-form" not found.');
    }
}

// Initialize grid cell click listeners (robust version)
function initializeGridCellListeners() {
    const gridCells = document.querySelectorAll('.grid-cell');
    if (gridCells.length === 0) {
        console.warn("No grid cells found in initializeGridCellListeners.");
        return;
    }

    gridCells.forEach((cell, index) => {
        cell.addEventListener('click', function(e) {
            if (e.target.classList.contains('event') || e.target.closest('.event')) {
                return; // Clicked on an existing event, don't open a new form
            }

            const columnIndex = (index % 8); // Grid: 1 time label col + 7 day cols
            if (columnIndex === 0) return; // Clicked on a time label cell

            const dayHeaderCells = document.querySelectorAll('.day-header-cell');
            if (columnIndex < 0 || columnIndex >= dayHeaderCells.length || dayHeaderCells.length === 0) {
                console.error('Error in initializeGridCellListeners: columnIndex (' + columnIndex + ') is out of bounds for dayHeaderCells (length: ' + dayHeaderCells.length + ').');
                return; 
            }
            
            const dayHeader = dayHeaderCells[columnIndex];
            if (!dayHeader) {
                console.error('Error in initializeGridCellListeners: dayHeader element is unexpectedly null/undefined for columnIndex:', columnIndex);
                return; 
            }

            const dayNumberElement = dayHeader.querySelector('.day-number'); 
            if (!dayNumberElement) {
                console.error('Error in initializeGridCellListeners: .day-number element not found within dayHeader:', dayHeader);
                return; 
            }
            const dayNumber = dayNumberElement.textContent.trim();
            
            const dateRangeTextElement = document.querySelector('.date-range');
            if (!dateRangeTextElement) {
                 console.error("Could not find '.date-range' element in initializeGridCellListeners");
                 return;
            }
            const dateRangeText = dateRangeTextElement.textContent;
            
            const monthMatch = dateRangeText.match(/([A-Za-z]+)\s\d+\s*(-|,)/);
            const yearMatch = dateRangeText.match(/,\s*(\d{4})/);
            
            const month = monthMatch ? monthMatch[1] : "April"; // Default or extract appropriately
            const year = yearMatch ? yearMatch[1] : "2025";   // Default or extract appropriately
            
            const visitDate = `${month} ${dayNumber}, ${year}`;
            
            const rowIndex = Math.floor(index / 8);
            const timeLabels = document.querySelectorAll('.time-label');

            if (rowIndex < 0 || rowIndex >= timeLabels.length || timeLabels.length === 0) {
                console.error('Error in initializeGridCellListeners: rowIndex (' + rowIndex + ') is out of bounds for timeLabels (length: ' + timeLabels.length + ').');
                return;
            }
            const timeLabel = timeLabels[rowIndex].textContent.trim();
            
            formpopup(visitDate, timeLabel);
        });
    });
}

// DOMContentLoaded for visit status and employee ID logic (robust version)
document.addEventListener('DOMContentLoaded', function() {
    const visitStatusSelect = document.getElementById('visit-status');
    const visitCompletedInput = document.getElementById('visits-completed');

    if (visitStatusSelect && visitCompletedInput) {
        visitStatusSelect.addEventListener('change', function() {
            if (visitStatusSelect.value === 'Completed') {
                visitCompletedInput.style.display = 'block'; // Or 'flex' based on your CSS for .form-row
            } else {
                visitCompletedInput.style.display = 'none';
            }
        });
    } else {
        if (!visitStatusSelect) console.warn("Element with ID 'visit-status' not found for event listener setup.");
        if (!visitCompletedInput) console.warn("Element with ID 'visits-completed' not found for event listener setup.");
    }
        });

// --- MAP MODAL CODE ---
function initializeMapFeature() {
    const mapLocationLink = document.getElementById('maplocation');
    if (mapLocationLink) {
        mapLocationLink.addEventListener('click', function(event) {
            event.preventDefault();
            openMapModal();
        });
    } else {
        console.warn("Element with ID 'maplocation' (Choose on map link) not found.");
    }

    const confirmLocationButton = document.getElementById('confirm-location-btn');
    if (confirmLocationButton) {
        confirmLocationButton.addEventListener('click', function() {
            console.log("Confirm button clicked. Current selectedLatLng:", selectedLatLng); 
            if (selectedLatLng) {
                const locationInput = document.getElementById('visit-location');
                if (locationInput) {
                    locationInput.value = `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;
                } else {
                    console.error("Visit location input field not found!");
                }
                closeMapModal();
            } else {
                alert("Please select a location on the map first.");
            }
        });
    } else {
        console.warn("Element with ID 'confirm-location-btn' not found.");
    }
}

function openMapModal() {
    // Moved reset logic to the beginning
    if (map && marker) { 
        try { // Add try-catch for safety if map/marker state is uncertain
            map.removeLayer(marker);
        } catch (e) {
            console.warn("Could not remove previous marker:", e);
        }
        marker = null;
    }
    selectedLatLng = null; 

    const modal = document.getElementById('map-modal');
    if (!modal) {
        console.error("Map modal element with ID 'map-modal' not found!");
        return;
    }

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('blur-background');
    }
    modal.style.display = 'flex';

    if (!map) { 
        try {
            map = L.map('map-container').setView([20.5937, 78.9629], 5); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            map.on('click', function(e) {
                selectedLatLng = e.latlng; 
                console.log("Map clicked. Coords:", e.latlng, "selectedLatLng is now:", selectedLatLng);
                if (marker) { 
                    marker.setLatLng(e.latlng);
                } else { 
                    marker = L.marker(e.latlng).addTo(map);
                }
            });
        } catch (e) {
            console.error("Error initializing Leaflet map:", e);
            alert("Could not initialize the map. Please ensure you are connected to the internet and try again.");
        }
    } else {
        try { // It's good practice to invalidate size after display change
            map.invalidateSize();
        } catch (e) {
            console.warn("Error invalidating map size:", e);
        }
    }
}

function closeMapModal() {
    const modal = document.getElementById('map-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.remove('blur-background');
    }
}

// jQuery $(document).ready - main initialization block
$(document).ready(function() {
    // Initialize DataTables if the element exists and function is available
    if (typeof $ !== 'undefined' && typeof $.fn.DataTable === 'function' && $('#mytable').length) {
        try {
            $('#mytable').DataTable();
        } catch (e) {
            console.warn("Error initializing DataTable:", e);
        }
    } else {
        // console.warn("DataTable function or #mytable element not found."); // Less verbose
    }

    initializeCalendarDayListeners();
    initializeGridCellListeners(); 
    initializeMapFeature(); 
});

// Window click listener for closing modals by clicking on the backdrop
window.addEventListener('click', function(event) {
    const visitModal = document.getElementById('visit-modal');
    const mapModal = document.getElementById('map-modal'); 

    if (visitModal && event.target === visitModal) { // Check if modal exists before comparing
        closeModal(); 
    }
    if (mapModal && event.target === mapModal) { 
        closeMapModal();
    }
});
// Add this global variable near your other map variables (map, marker)
let selectedLocationData = null; // Will store { address: '...', lat: ..., lon: ... }

// (Keep your existing global variables: map, marker, selectedLatLng, currentUserRole)
// (Keep your existing functions: getUserRole, initializeCalendarDayListeners, formpopup, closeModal, initializeGridCellListeners, DOMContentLoaded listener)

// --- NEW/MODIFIED MAP MODAL CODE ---

// New function to perform reverse geocoding
async function reverseGeocodeAndDisplay(latlng) {
    const addressTextElement = document.getElementById('selected-map-address-text');
    const confirmButton = document.getElementById('confirm-location-btn');

    if (!addressTextElement) {
        console.error("selected-map-address-text element not found");
        return;
    }

    addressTextElement.textContent = 'Fetching address...';
    addressTextElement.style.fontStyle = 'italic';
    addressTextElement.style.color = '#555';
    if (confirmButton) confirmButton.disabled = true; // Disable confirm button while fetching

    selectedLocationData = null; // Reset previous selection data

    // Nominatim API endpoint for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}&accept-language=en`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SalesVisitPlannerApp/1.0 (your-email@example.com)' // Replace with your app name and contact
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Nominatim API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
        }
        const data = await response.json();

        if (data && data.display_name) {
            addressTextElement.textContent = data.display_name;
            addressTextElement.style.fontStyle = 'normal';
            addressTextElement.style.color = '#000';
            selectedLocationData = {
                address: data.display_name,
                lat: latlng.lat,
                lon: latlng.lng // Corrected from lng to lon for consistency if needed
            };
            console.log("Geocoded Address:", selectedLocationData.address);
            if (confirmButton) confirmButton.disabled = false; // Enable confirm button
        } else {
            addressTextElement.textContent = 'Address not found. Try another location or enter manually.';
            console.warn("Reverse geocoding did not return a display_name:", data);
        }
    } catch (error) {
        console.error('Error during reverse geocoding:', error);
        addressTextElement.textContent = 'Could not fetch address. Please try again or enter manually.';
        // Optionally, log the error message to the user display for more info if it's a network error.
        if (error.message.includes('Failed to fetch')) {
             addressTextElement.textContent += ' (Network error or service unavailable)';
        }
    }
}


function initializeMapFeature() {
    const mapLocationLink = document.getElementById('maplocation');
    if (mapLocationLink) {
        mapLocationLink.addEventListener('click', function(event) {
            event.preventDefault();
            openMapModal();
        });
    } else {
        console.warn("Element with ID 'maplocation' (Choose on map link) not found.");
    }

    const confirmLocationButton = document.getElementById('confirm-location-btn');
    if (confirmLocationButton) {
        confirmLocationButton.addEventListener('click', function() {
            console.log("Confirm button clicked. Current selectedLocationData:", selectedLocationData); 
            if (selectedLocationData && selectedLocationData.address) { // Check for the address
                const locationInput = document.getElementById('visit-location');
                if (locationInput) {
                    locationInput.value = selectedLocationData.address; // Use the fetched address
                } else {
                    console.error("Visit location input field not found!");
                }
                closeMapModal();
            } else {
                alert("Please select a location on the map and wait for the address to appear.");
            }
        });
    } else {
        console.warn("Element with ID 'confirm-location-btn' not found.");
    }
}

function openMapModal() {
    if (map && marker) { 
        try {
            map.removeLayer(marker);
        } catch (e) {
            console.warn("Could not remove previous marker:", e);
        }
        marker = null;
    }
    selectedLocationData = null; // Reset selected location data

    // Reset the address display text
    const addressTextElement = document.getElementById('selected-map-address-text');
    if (addressTextElement) {
        addressTextElement.textContent = 'Click on the map to select a location.';
        addressTextElement.style.fontStyle = 'italic';
        addressTextElement.style.color = '#555';
    }
    const confirmButton = document.getElementById('confirm-location-btn');
    if (confirmButton) confirmButton.disabled = true; // Initially disable confirm button


    const modal = document.getElementById('map-modal');
    if (!modal) {
        console.error("Map modal element with ID 'map-modal' not found!");
        return;
    }

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('blur-background');
    }
    modal.style.display = 'flex';

    if (!map) { 
        try {
            map = L.map('map-container').setView([20.5937, 78.9629], 5); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            map.on('click', function(e) {
                const clickedLatLng = e.latlng; 
                // Update marker position
                if (marker) { 
                    marker.setLatLng(clickedLatLng);
                } else { 
                    marker = L.marker(clickedLatLng).addTo(map);
                }
                // Perform reverse geocoding
                reverseGeocodeAndDisplay(clickedLatLng); 
            });
        } catch (e) {
            console.error("Error initializing Leaflet map:", e);
            if(addressTextElement) addressTextElement.textContent = "Map initialization failed.";
            // alert("Could not initialize the map. Please ensure you are connected to the internet and try again.");
        }
    } else {
        try { 
            map.invalidateSize();
        } catch (e) {
            console.warn("Error invalidating map size:", e);
        }
    }
}

function closeMapModal() {
    const modal = document.getElementById('map-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.remove('blur-background');
    }
    // Optionally reset the address text and button state if modal is closed without confirming
    const addressTextElement = document.getElementById('selected-map-address-text');
    if (addressTextElement) {
        addressTextElement.textContent = 'Click on the map to select a location.';
        addressTextElement.style.fontStyle = 'italic';
        addressTextElement.style.color = '#555';
    }
    const confirmButton = document.getElementById('confirm-location-btn');
    if (confirmButton) confirmButton.disabled = true;
}
