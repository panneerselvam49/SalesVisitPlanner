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
            const visitDate = `${monthYear} ${dayNumber}`; 
            formpopup(visitDate, "9 AM"); 
        });
    });
}
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
    } 
    const visitForm = document.getElementById('visit-form');
    if (visitForm) {
        visitForm.reset(); 
        const locationInput = document.getElementById('visit-location');
        if(locationInput) locationInput.value = '';
        const statusSelect = document.getElementById('visit-status');
        if(statusSelect) statusSelect.value = 'Planned';

        const visitCompletedInput = document.getElementById('visits-completed');
        if (visitCompletedInput) {
            visitCompletedInput.style.display = 'none';
        }

    } else {
        console.error('In closeModal: Element with ID "visit-form" not found.');
    }
}

function initializeGridCellListeners() {
    const gridCells = document.querySelectorAll('.grid-cell');
    if (gridCells.length === 0) {
        console.warn("No grid cells found in initializeGridCellListeners.");
        return;
    }

    gridCells.forEach((cell, index) => {
        cell.addEventListener('click', function(e) {
            if (e.target.classList.contains('event') || e.target.closest('.event')) {
                return; 
            }

            const columnIndex = (index % 8); 
            if (columnIndex === 0) return;

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
            
            const month = monthMatch ? monthMatch[1] : "April"; 
            const year = yearMatch ? yearMatch[1] : "2025";  
            
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

async function handleVisitFormSubmit(event) {
    event.preventDefault(); // Prevent default page reload

    const visitForm = document.getElementById('visit-form');
    const submitButton = visitForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    const getFieldValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : null;
    };

    const visitData = {
        customer_id: getFieldValue('customerid'), 
        employee_id: getFieldValue('employeeid'), 
        date: getFieldValue('visit-date'),
        start_time: getFieldValue('starttime'),
        end_time: getFieldValue('endtime'),
        location: getFieldValue('visit-location'),
        purpose: getFieldValue('purpose'),
        notes: document.getElementById('visit-status').value === 'Completed' ? getFieldValue('completion-notes') : getFieldValue('Description'),
    };
    if (!visitData.employee_id || !visitData.customer_id || !visitData.date || !visitData.start_time || !visitData.end_time || !visitData.location) {
        alert('Please fill in all required visit details: Employee ID, Customer ID, Date, Start Time, End Time, and Location.');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
    }

    console.log('Submitting Visit Data:', visitData); // For debugging

    try {
        const response = await fetch('/api/visit', { // Make sure this URL is correct
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(visitData),
        });
    } catch (error) {
        console.error('Error submitting visit form:', error);
        alert('An error occurred while saving the visit. Check the console for details.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

$(document).ready(function() {
    const visitForm = document.getElementById('visit-form');
    if (visitForm) {
        visitForm.addEventListener('submit', handleVisitFormSubmit);
    } else {
        console.error("Visit form with ID 'visit-form' not found for submit listener.");
    }

    initializeCalendarDayListeners(); //
    initializeGridCellListeners(); //
});

    const monthYear = document.getElementById("month-year");
    const calendarGrid = document.querySelector(".calendar-grid");

    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    function renderCalendar(month, year) {
        calendarGrid.innerHTML = "";
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement("div");
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        const firstDay = new Date(year, month).getDay(); // 0-6
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) {
            calendarGrid.appendChild(document.createElement("div"));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement("div");
            dayCell.classList.add("day");
            dayCell.textContent = day;

            // Highlight today
            if (
                day === currentDate.getDate() &&
                month === currentDate.getMonth() &&
                year === currentDate.getFullYear()
            ) {
                dayCell.classList.add("today");
            }

            calendarGrid.appendChild(dayCell);
        }
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        monthYear.textContent = `${monthNames[month]} ${year}`;
    }
    prevBtn.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextBtn.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    // At the top of landingpage.js, ensure you have a way to get the current user's role if needed for display,
// though the example below focuses on displaying fetched employee name.

// ... (keep existing functions like getUserRole, initializeCalendarDayListeners, formpopup, closeModal, initializeGridCellListeners)

// Helper function to parse time (you might need to adjust based on actual time format from backend)
function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    // Assuming timeStr is like "HH:MM:SS"
    return timeStr.substring(0, 5); // Returns "HH:MM"
}

// Helper function to parse date (you might need to adjust)
function parseDate(dateString) { // e.g., "2025-04-23T00:00:00.000Z" or "2025-04-23"
    const date = new Date(dateString);
    return {
        year: date.getFullYear(),
        month: date.getMonth(), // 0-indexed (0 for January)
        day: date.getDate()
    };
}

async function handleVisitFormSubmit(event) {
    event.preventDefault();

    const visitForm = document.getElementById('visit-form');
    const submitButton = visitForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    const getFieldValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : null;
    };
    const statusValue = document.getElementById('visit-status').value; // Get status from form

    const visitData = {
        customer_id: getFieldValue('customerid'),
        employee_id: getFieldValue('employeeid'), // Make sure this ID matches an actual employee ID for the backend to link
        date: getFieldValue('visit-date'),
        start_time: getFieldValue('starttime'),
        end_time: getFieldValue('endtime'),
        location: getFieldValue('company-location'), // Or a specific visit location field if you add one
        purpose: getFieldValue('purpose'),
        notes: statusValue === 'Completed' ? getFieldValue('completion-notes') : '', // Simplified notes logic
        status: statusValue
    };

    if (!visitData.employee_id || !visitData.customer_id || !visitData.date || !visitData.start_time || !visitData.end_time || !visitData.location) {
        alert('Please fill in all required visit details: Employee ID, Customer ID, Date, Start Time, End Time, and Location.');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
    }

    console.log('Submitting Visit Data:', visitData);

    try {
        const response = await fetch('/api/visit', { // API endpoint from server.js
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(visitData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const newDetailedVisit = await response.json();
        console.log('Visit saved successfully, response:', newDetailedVisit);
        addEventToTimeline(newDetailedVisit); // Call the new function to update UI
        closeModal(); // Close modal on success

    } catch (error) {
        console.error('Error submitting visit form:', error);
        alert(`An error occurred while saving the visit: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

function addEventToTimeline(detailedVisit) {
    if (!detailedVisit || !detailedVisit.date || !detailedVisit.start_time || !detailedVisit.status) {
        console.error('Invalid visit data for timeline update:', detailedVisit);
        return;
    }

    const visitDateParts = parseDate(detailedVisit.date); // e.g. { year: 2025, month: 3, day: 23 } for April 23, 2025
    const visitStartTime = formatTimeForDisplay(detailedVisit.start_time); // e.g., "09:00"
    const visitStatus = detailedVisit.status.toLowerCase(); // e.g., "planned"

    // --- Locating the target cell ---
    const dayHeaders = document.querySelectorAll('.day-headers .day-header-cell');
    const timeLabels = document.querySelectorAll('.time-grid .time-label');
    const timeGrid = document.querySelector('.time-grid');
    const dateRangeText = document.querySelector('.week-header .date-range').textContent; // e.g., "April 20 - 26, 2025"

    let targetDayColumnIndex = -1; // 1-indexed based on dayHeaderCells (0 is empty)
    const currentYearInView = parseInt(dateRangeText.match(/(\d{4})/)[0]);
    const currentMonthNameInView = dateRangeText.match(/([A-Za-z]+)/)[0];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthInView = monthNames.findIndex(m => m.toLowerCase() === currentMonthNameInView.toLowerCase());


    if (visitDateParts.year !== currentYearInView || visitDateParts.month !== currentMonthInView) {
        console.warn("Visit date is not in the currently displayed week's month/year. Event not added.");
        return; // Or implement logic to switch week view
    }

    dayHeaders.forEach((header, index) => {
        if (index === 0) return; // Skip the empty first cell
        const dayNumberEl = header.querySelector('.day-number');
        if (dayNumberEl && parseInt(dayNumberEl.textContent) === visitDateParts.day) {
            targetDayColumnIndex = index;
        }
    });

    if (targetDayColumnIndex === -1) {
        console.warn("Visit date's day not found in current week view. Event not added.", visitDateParts);
        return;
    }

    let targetRowIndex = -1;
    timeLabels.forEach((label, index) => {
        // Assuming timeLabel format is "X AM/PM" and visitStartTime is "HH:MM"
        // This matching logic needs to be robust.
        // Example: if label is "9 AM" and visitStartTime is "09:00"
        const labelTime = label.textContent.trim().toUpperCase(); // "9 AM"
        const visitHour = parseInt(visitStartTime.split(':')[0]); // 9

        let labelHour;
        if (labelTime.includes("AM")) {
            labelHour = parseInt(labelTime.replace(" AM", ""));
            if (labelHour === 12) labelHour = 0; // 12 AM is hour 0
        } else if (labelTime.includes("PM")) {
            labelHour = parseInt(labelTime.replace(" PM", ""));
            if (labelHour !== 12) labelHour += 12; // 1 PM is 13, 12 PM is 12
        }

        if (visitHour === labelHour) {
            targetRowIndex = index;
        }
    });

    if (targetRowIndex === -1) {
        console.warn("Visit start time slot not found in current week view. Event not added.", visitStartTime);
        return;
    }

    // The actual cell index in the flat list of timeGrid children:
    // Each row has 1 time-label + 7 day-cells = 8 children per row.
    // The target cell is (targetDayColumnIndex)-th cell in the (targetRowIndex)-th row.
    const targetCellIndex = targetRowIndex * 8 + targetDayColumnIndex;
    const targetCell = timeGrid.children[targetCellIndex];

    if (!targetCell || !targetCell.classList.contains('grid-cell')) {
        console.error("Calculated target cell is not a valid grid-cell:", targetCell, "at index", targetCellIndex);
        return;
    }

    // --- Create and append event element ---
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event', visitStatus); // e.g., 'event planned'
    // Safely access nested properties for display
    const employeeName = detailedVisit.Employee ? detailedVisit.Employee.name : 'N/A';
    const customerName = detailedVisit.Customer ? detailedVisit.Customer.customer_name : 'N/A';

    eventDiv.textContent = `Emp ${employeeName} - ${customerName} (${visitStartTime})`;
    // You can add more details to eventDiv.innerHTML or set data attributes
    eventDiv.setAttribute('data-visit-id', detailedVisit.visit_id);

    // Clear previous events in the cell (optional, if you only want one event per slot visually for now)
    // targetCell.innerHTML = '';
    targetCell.appendChild(eventDiv);
    console.log(`Event added to: Day Column Index ${targetDayColumnIndex}, Row Index ${targetRowIndex}`);
}


// Modify your DOMContentLoaded listener
$(document).ready(function() { // Your original code uses jQuery's ready
    const visitForm = document.getElementById('visit-form');
    if (visitForm) {
        visitForm.addEventListener('submit', handleVisitFormSubmit);
    } else {
        console.error("Visit form with ID 'visit-form' not found for submit listener.");
    }

    initializeCalendarDayListeners();
    initializeGridCellListeners();

    // Dynamic Calendar (Month View) - from your existing code
    const monthYearEl = document.getElementById("month-year");
    const calendarGridEl = document.querySelector(".calendar .calendar-grid"); // Target .calendar .calendar-grid
    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");

    if(monthYearEl && calendarGridEl && prevBtn && nextBtn) {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear();

        function renderCalendar(month, year) {
            if (!calendarGridEl) return;
            calendarGridEl.innerHTML = ""; // Clear previous grid
            daysOfWeek.forEach(day => {
                const dayHeader = document.createElement("div");
                dayHeader.textContent = day;
                calendarGridEl.appendChild(dayHeader);
            });

            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let i = 0; i < firstDayOfMonth; i++) {
                calendarGridEl.appendChild(document.createElement("div"));
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement("div");
                dayCell.classList.add("day");
                dayCell.textContent = day;

                if (day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
                    dayCell.classList.add("today");
                }
                // Re-attach click listener for new day cells if needed for form popup
                 dayCell.addEventListener('click', function() {
                    const dayNumberText = this.textContent;
                    const monthYearText = monthYearEl.textContent; // "Month Year"
                    const visitDateForForm = `${monthYearText} ${dayNumberText}`;
                    // Assuming 9 AM as default, or extract from context
                    formpopup(visitDateForForm, "9:00 AM");
                });
                calendarGridEl.appendChild(dayCell);
            }
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthYearEl.textContent = `${monthNames[month]} ${year}`;
        }

        prevBtn.addEventListener("click", () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentMonth, currentYear);
        });

        nextBtn.addEventListener("click", () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentMonth, currentYear);
        });
        renderCalendar(currentMonth, currentYear); // Initial render
    } else {
        console.warn("One or more calendar elements (month-year, calendar-grid, prev-month, next-month) not found.");
    }
    const visitStatusSelect = document.getElementById('visit-status');
    const visitCompletedInput = document.getElementById('visits-completed');

    if (visitStatusSelect && visitCompletedInput) { // From your existing code
        visitStatusSelect.addEventListener('change', function() {
            if (visitStatusSelect.value === 'Completed') {
                visitCompletedInput.style.display = 'block';
            } else {
                visitCompletedInput.style.display = 'none';
            }
        });
    }
});

async function handleVisitFormSubmit(event) {
    event.preventDefault(); // Prevent default page reload

    const visitForm = document.getElementById('visit-form');
    const submitButton = visitForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    const getFieldValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : null;
    };
    const statusValue = document.getElementById('visit-status').value;

    const visitData = {
        customer_id: getFieldValue('customerid'),
        employee_id: getFieldValue('employeeid'),
        date: getFieldValue('visit-date'),
        start_time: getFieldValue('starttime'),
        end_time: getFieldValue('endtime'),
        location: getFieldValue('company-location'), // Ensure this ID is correct for visit location
        purpose: getFieldValue('purpose'),
        notes: statusValue === 'Completed' ? getFieldValue('completion-notes') : '',
        status: statusValue
    };
    if (!visitData.employee_id || !visitData.customer_id || !visitData.date || !visitData.start_time || !visitData.end_time || !visitData.location) {
        alert('Please fill in all required visit details: Employee ID, Customer ID, Date, Start Time, End Time, and Location.');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
    }

    console.log('Submitting Visit Data:', visitData);

    try {
        const response = await fetch('/api/visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(visitData),
        });

        if (!response.ok) {
            // Attempt to parse the error response from the server
            const errorDataFromServer = await response.json().catch(() => ({
                error: "Failed to parse error response from server",
                details: "Server returned an error status without a JSON body or with malformed JSON."
            }));

            // Log the detailed error data from the server to the browser console
            console.error('Server error response data (from /api/visit in browser console):', errorDataFromServer);
            
            // errorDataFromServer should be an object like: { error: 'Failed to save visit', details: 'THE ACTUAL SERVER ERROR MESSAGE' }
            let detailedMessage = errorDataFromServer.details || errorDataFromServer.error || `Server responded with ${response.status}`;
            
            alert(`Failed to save visit: ${detailedMessage}`);
            throw new Error(detailedMessage); // Throw the more detailed message
        }

        const newDetailedVisit = await response.json();
        console.log('Visit saved successfully, response:', newDetailedVisit);
        if (typeof addEventToTimeline === 'function') { // Check if function exists before calling
            addEventToTimeline(newDetailedVisit);
        }
        if (typeof closeModal === 'function') { // Check if function exists
            closeModal();
        }

    } catch (error) {
        console.error('Overall error submitting visit form (browser console):', error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}