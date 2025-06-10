let currentView = 'week';
let currentDate = new Date();
let smallCalendarDate = new Date();
let allVisits = [];

function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- API & DATA FETCHING ---
async function fetchAllVisits() {
    try {
        const response = await fetch('/api/visit');
        if (!response.ok) throw new Error(`Failed to fetch visits. Status: ${response.status}`);
        allVisits = await response.json();
        renderMainView();
        renderSmallCalendar();
    } catch (error) {
        console.error('Error loading all visits:', error);
    }
}

async function fetchLeadDetails() {
    const leadDetailsSelect = document.getElementById('leaddetails');
    try {
        const response = await fetch('/api/lead');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const leads = await response.json();
        leadDetailsSelect.innerHTML = '<option value="">Select a Lead...</option>';
        leads.forEach(lead => {
            const option = document.createElement('option');
            option.value = lead.company_name;
            option.textContent = lead.location ? `${lead.company_name} - ${lead.location}` : lead.company_name;
            leadDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
    }
}

// This function should now fetch from the company list to populate the dropdown
async function fetchAndPopulateCompanyDropdown() {
    const companyDetailsSelect = document.getElementById('companydetails');
    try {
        const response = await fetch('/api/company'); // Fetches the list of companies
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const companies = await response.json();
        
        companyDetailsSelect.innerHTML = '<option value="">Select a Company...</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.company_name; // The value is the company name
            option.textContent = `${company.company_name} (${company.location})`;
            companyDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching companies for dropdown:', error);
    }
}


// This function now correctly displays the company name from the customer record
function createEventDiv(visit) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${visit.status.replace(/\s+/g, '-').toLowerCase()}`;
    eventDiv.setAttribute('data-visit-id', visit.visit_id);

    let displayName = 'Unknown';
    if (visit.Customer) {
        // Gets company_name directly from the Customer object
        displayName = visit.Customer.company_name;
    } else if (visit.Lead) {
        displayName = visit.Lead.company_name;
    }

    const displayTime = formatTimeForDisplay(visit.start_time);
    eventDiv.textContent = `${displayName} (${visit.Customer?.customer_name || ''}) @ ${displayTime}`;
    return eventDiv;
}


// The month view rendering is also updated
function renderMonthView() {
    const viewContainer = document.getElementById('main-view-container');
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    let dayHeadersHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        .map(day => `<div class="month-day-header">${day}</div>`).join('');

    let dayCellsHTML = '';
    for (let i = 0; i < firstDayOfWeek; i++) {
        dayCellsHTML += `<div class="month-day-cell other-month"></div>`;
    }

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const cellDate = new Date(year, month, day);
        let todayClass = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 'today' : '';
        dayCellsHTML += `
            <div class="month-day-cell ${todayClass}" data-date="${cellDate.toISOString().split('T')[0]}">
                <div class="month-day-number">${day}</div>
            </div>`;
    }

    const totalCells = firstDayOfWeek + lastDayOfMonth.getDate();
    const remainingCells = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remainingCells; i++) {
        dayCellsHTML += `<div class="month-day-cell other-month"></div>`;
    }

    viewContainer.innerHTML = `
        <div class="month-view-grid">
            ${dayHeadersHTML}
            ${dayCellsHTML}
        </div>`;

    const visitsForMonth = allVisits.filter(visit => {
        const visitDate = new Date(visit.date);
        return visitDate.getFullYear() === year && visitDate.getMonth() === month;
    });

    visitsForMonth.forEach(visit => {
        const cell = viewContainer.querySelector(`[data-date="${visit.date}"]`);
        if (cell) {
            const eventDiv = document.createElement('div');
            eventDiv.className = `month-event ${visit.status.replace(/\s+/g, '-').toLowerCase()}`;
            eventDiv.setAttribute('data-visit-id', visit.visit_id);
            
            let displayName = 'Unknown';
            if (visit.Customer) {
                // Gets company_name directly from the Customer object
                displayName = visit.Customer.company_name;
            } else if (visit.Lead) {
                displayName = visit.Lead.company_name;
            }

            eventDiv.textContent = `${formatTimeForDisplay(visit.start_time)} ${displayName}`;
            cell.appendChild(eventDiv);
        }
    });
}

function renderMainView() {
    updateHeaders();
    switch (currentView) {
        case 'day':
            renderDayWeekView(1);
            break;
        case 'month':
            renderMonthView();
            break;
        case 'week':
        default:
            renderDayWeekView(7);
            break;
    }
}

// Updates the main headers based on the current date and view
function updateHeaders() {
    const viewTitle = document.getElementById('view-title');
    const viewDateRange = document.getElementById('view-date-range');

    if (currentView === 'month') {
        viewTitle.textContent = 'Month View';
        viewDateRange.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (currentView === 'week') {
        viewTitle.textContent = 'Week View';
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        viewDateRange.textContent = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
    } else if (currentView === 'day') {
        viewTitle.textContent = 'Day View';
        viewDateRange.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
}

// Renders both the Day and Week views, handling multiple events
function renderDayWeekView(numberOfDays) {
    const viewContainer = document.getElementById('main-view-container');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStartsOn = new Date(currentDate);
    if (numberOfDays === 7) {
        weekStartsOn.setDate(currentDate.getDate() - currentDate.getDay());
    }
    weekStartsOn.setHours(0, 0, 0, 0);

    let dayHeadersHTML = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < numberOfDays; i++) {
        const currentDateHeader = new Date(weekStartsOn);
        currentDateHeader.setDate(weekStartsOn.getDate() + i);
        const dayName = numberOfDays === 1 ? dayNames[currentDateHeader.getDay()] : dayNames[i];
        const dayNumberClass = (currentDateHeader.getTime() === today.getTime()) ? 'day-number today' : 'day-number';
        dayHeadersHTML += `<div class="day-header-cell"><div class="day-name">${dayName}</div><div class="${dayNumberClass}">${currentDateHeader.getDate()}</div></div>`;
    }

    let timeGridHTML = '';
    for (let i = 0; i < 24; i++) {
        timeGridHTML += `<div class="time-label">${i}</div>`;
        for (let j = 0; j < numberOfDays; j++) {
            const dateForSlot = new Date(weekStartsOn);
            dateForSlot.setDate(weekStartsOn.getDate() + j);
            const timeSlotId = `${dateForSlot.toISOString().split('T')[0]}_${String(i).padStart(2, '0')}`;
            timeGridHTML += `<div class="grid-cell" data-time-slot="${timeSlotId}"><div class="event-wrapper"></div></div>`;
        }
    }

    viewContainer.innerHTML = `
        <div class="day-headers" style="grid-template-columns: 60px repeat(${numberOfDays}, 1fr);">
            <div class="day-header-cell"></div>
            ${dayHeadersHTML}
        </div>
        <div class="time-grid-wrapper">
            <div class="time-grid" style="grid-template-columns: 60px repeat(${numberOfDays}, 1fr);">${timeGridHTML}</div>
        </div>`;

    const visitsByTimeSlot = {};
    allVisits.forEach(visit => {
        const visitHour = parseInt(visit.start_time.substring(0, 2), 10);
        const timeSlotId = `${visit.date}_${String(visitHour).padStart(2, '0')}`;
        if (!visitsByTimeSlot[timeSlotId]) {
            visitsByTimeSlot[timeSlotId] = [];
        }
        visitsByTimeSlot[timeSlotId].push(visit);
    });

    for (const timeSlotId in visitsByTimeSlot) {
        const targetCell = viewContainer.querySelector(`[data-time-slot="${timeSlotId}"]`);
        if (targetCell) {
            const wrapper = targetCell.querySelector('.event-wrapper');
            visitsByTimeSlot[timeSlotId].forEach(visit => {
                const eventDiv = createEventDiv(visit);
                wrapper.appendChild(eventDiv);
            });
        }
    }

    initializeGridCellListeners(weekStartsOn, numberOfDays);
}

function createEventDiv(visit) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${visit.status.replace(/\s+/g, '-').toLowerCase()}`;
    eventDiv.setAttribute('data-visit-id', visit.visit_id);

    let displayName = 'Unknown';
    if (visit.Customer) {
        displayName = visit.Customer.company_name || visit.Customer.customer_name;
    } else if (visit.Lead) {
        displayName = visit.Lead.company_name;
    }

    const displayTime = formatTimeForDisplay(visit.start_time);
    eventDiv.textContent = `${displayName} @ ${displayTime}`;
    return eventDiv;
}

// Handles conditional visibility of the "Save & Add Another" button
function formpopup(cellDate, cellTime) {
    const modal = document.getElementById('visit-modal');
    const visitForm = document.getElementById('visit-form');
    visitForm.reset();
    document.getElementById('visit-id-holder').value = '';
    
    document.getElementById('save-btn').style.display = 'inline-block';
    document.getElementById('update-btn').style.display = 'none';
    document.getElementById('delete-visit-btn').style.display = 'none';
    
    const saveAndAddButton = document.getElementById('save-add-another-btn');
    const clickedDateString = new Date(cellDate).toISOString().split('T')[0];
    
    const visitsOnThisDay = allVisits.some(visit => visit.date === clickedDateString);
    
    if (visitsOnThisDay) {
        saveAndAddButton.style.display = 'inline-block';
    } else {
        saveAndAddButton.style.display = 'none';
    }

    document.querySelector('.main-content').classList.add('blur-background');
    const visitDateInput = document.getElementById('visit-date');
    if (cellDate) {
        visitDateInput.value = clickedDateString;
    }
    const visitStartTimeInput = document.getElementById('starttime');
    if (cellTime) {
        visitStartTimeInput.value = cellTime;
    }
    modal.style.display = 'flex';
}

// REPLACE your old populateAndShowVisitForm function with this one

function populateAndShowVisitForm(visit) {
    if (!visit) return;

    // This function opens the modal and sets the date/time
    formpopup(visit.date, formatTimeForDisplay(visit.start_time));
    
    // --- Basic Information ---
    document.getElementById('visit-id-holder').value = visit.visit_id;
    document.getElementById('visit-employee-id').value = visit.employee_id;
    document.getElementById('endtime').value = formatTimeForDisplay(visit.end_time);
    document.getElementById('visit-location').value = visit.location;
    document.getElementById('purpose').value = visit.purpose;
    document.getElementById('visit-status').value = visit.status;
    document.getElementById('completion-notes').value = visit.notes || '';
    document.getElementById('visit-status').dispatchEvent(new Event('change'));

    const customerRadio = document.getElementById('visit-type-customer');
    const leadRadio = document.getElementById('visit-type-lead');
    const customerContainer = document.getElementById('customer-dropdown-container');
    const leadContainer = document.getElementById('lead-dropdown-container');
    if (visit.Customer) {
        customerRadio.checked = true;
        customerContainer.style.display = 'block';
        leadContainer.style.display = 'none';
        document.getElementById('companydetails').value = visit.Customer.company_name;
        document.getElementById('person-name').value = visit.Customer.customer_name || '';
        document.getElementById('contact-details-input').value = visit.Customer.contact_details || '';
    } else if (visit.Lead) {
        leadRadio.checked = true;
        leadContainer.style.display = 'block';
        customerContainer.style.display = 'none';
        document.getElementById('leaddetails').value = visit.Lead.company_name;
    }
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('save-add-another-btn').style.display = 'none';
    document.getElementById('update-btn').style.display = 'inline-block';
    document.getElementById('delete-visit-btn').style.display = 'inline-block';
}
// Closes the popup modal
function closeform() {
    document.getElementById('visit-modal').style.display = "none";
    document.querySelector('.main-content').classList.remove('blur-background');
}

// Handles form submission for all save/update actions
async function handleVisitFormSubmit(event, closeAfterSave = true) {
    event.preventDefault();
    const visitId = document.getElementById('visit-id-holder').value;
    const getFieldValue = id => document.getElementById(id)?.value.trim() || null;

    let visitData = {
        employee_id: getFieldValue('visit-employee-id'),
        date: getFieldValue('visit-date'),
        start_time: getFieldValue('starttime'),
        end_time: getFieldValue('endtime'),
        location: getFieldValue('visit-location'),
        purpose: getFieldValue('purpose'),
        status: document.getElementById('visit-status').value,
        notes: getFieldValue('completion-notes'),
        person_name: getFieldValue('person-name'),
        contact_details: getFieldValue('contact-details-input') 
    };

    // This block validates the input for a NEW visit
    if (!visitId) {
        const companyName = getFieldValue('companydetails');
        const leadCompanyName = getFieldValue('leaddetails');
        
        if (companyName) {
            visitData.company_name = companyName; 
        } else if (leadCompanyName) {
            visitData.lead_company_name = leadCompanyName;
        } else {
            // **This is the crucial part that was likely missing.**
            // It stops the function and shows an alert BEFORE sending to the server.
            return alert('You must select either a Company or a Lead.');
        }
    }

    const method = visitId ? 'PUT' : 'POST';
    const url = visitId ? `/api/visit/${visitId}` : '/api/visit';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(visitData)
        });
        if (!response.ok) {
            // This is where the error message from the server is caught
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
        
        await fetchAllVisits();

        if (closeAfterSave) {
            closeform();
        } else {
            const savedDate = document.getElementById('visit-date').value;
            document.getElementById('visit-form').reset();
            document.getElementById('visit-date').value = savedDate;
            alert("Visit saved. You can now add another.");
        }
    } catch (error) {
        console.error('Error saving/updating visit:', error);
        alert(`Failed to save visit: ${error.message}`);
    }
}

// Handles deleting a visit
async function handleDeleteVisit(event) {
    event.preventDefault();
    const visitId = document.getElementById('visit-id-holder').value;
    if (!visitId || !confirm('Are you sure you want to delete this visit?')) return;
    try {
        const response = await fetch(`/api/visit/${visitId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete visit.');
        closeform();
        fetchAllVisits();
    } catch (error)
    {
        console.error('Error deleting visit:', error);
        alert(error.message);
    }
}
// Initializes listeners for clicking on empty grid cells
function initializeGridCellListeners(weekStartsOn, numberOfDays) {
    document.querySelectorAll('.grid-cell').forEach((cell, index) => {
        cell.addEventListener('click', function(e) {
            if (e.target.closest('.event')) return;
            const dayIndex = index % numberOfDays;
            const hourIndex = Math.floor(index / numberOfDays);
            const clickedDate = new Date(weekStartsOn);
            clickedDate.setDate(weekStartsOn.getDate() + dayIndex);
            const timeForPopup = `${String(hourIndex).padStart(2, '0')}:00`;
            formpopup(clickedDate, timeForPopup);
        });
    });
}

// Sets up all event listeners for the page
function initializeAllListeners() {
    document.getElementById('visit-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeform();
        }
    });
    document.querySelectorAll('#calendar-view-toggle .view-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('#calendar-view-toggle .view-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentView = this.getAttribute('data-view');
            renderMainView();
        });
    });
    document.getElementById("prev-months").addEventListener("click", () => {
        if (currentView === 'day') currentDate.setDate(currentDate.getDate() - 1);
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
        else currentDate.setMonth(currentDate.getMonth() - 1);
        smallCalendarDate = new Date(currentDate);
        renderMainView();
        renderSmallCalendar();
    });

    document.getElementById("next-months").addEventListener("click", () => {
        if (currentView === 'day') currentDate.setDate(currentDate.getDate() + 1);
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
        else currentDate.setMonth(currentDate.getMonth() + 1);
        smallCalendarDate = new Date(currentDate);
        renderMainView();
        renderSmallCalendar();
    });

    // Sidebar-only Navigation
    document.getElementById("prev-month").addEventListener("click", () => {
        smallCalendarDate.setMonth(smallCalendarDate.getMonth() - 1);
        renderSmallCalendar();
    });

    document.getElementById("next-month").addEventListener("click", () => {
        smallCalendarDate.setMonth(smallCalendarDate.getMonth() + 1);
        renderSmallCalendar();
    });

    document.getElementById('today-btn').addEventListener('click', () => {
        currentDate = new Date();
        smallCalendarDate = new Date();
        renderMainView();
        renderSmallCalendar();
    });

    // Form Submissions
    document.getElementById('visit-form').addEventListener('submit', (e) => handleVisitFormSubmit(e, true));
    document.getElementById('save-add-another-btn').addEventListener('click', (e) => handleVisitFormSubmit(e, false));
    document.getElementById('update-btn').addEventListener('click', (e) => handleVisitFormSubmit(e, true));
    document.getElementById('delete-visit-btn').addEventListener('click', handleDeleteVisit);
    document.getElementById('main-view-container').addEventListener('click', async function(e) {
        const eventElement = e.target.closest('.event, .month-event');
        if (eventElement) {
            const visitId = eventElement.getAttribute('data-visit-id');
            if (visitId) {
                const visitData = allVisits.find(v => v.visit_id == visitId);
                if (visitData) {
                    populateAndShowVisitForm(visitData);
                } else {
                    alert('Could not load visit details.');
                }
            }
        }
    });

    // Dropdown logic
    const customerDropdown = document.getElementById('companydetails');
    const leadDropdown = document.getElementById('leaddetails');
    customerDropdown.addEventListener('change', (e) => {
        if (e.target.value) leadDropdown.value = '';
    });
    leadDropdown.addEventListener('change', () => {
        if (leadDropdown.value) customerDropdown.value = '';
    });

    // Status change logic
    document.getElementById('visit-status').addEventListener('change', (e) => {
        document.getElementById('visits-completed').style.display = (e.target.value === 'Completed') ? 'block' : 'none';
    });
}

// Renders the small sidebar calendar with conditional visit indicators
function renderSmallCalendar() {
    const month = smallCalendarDate.getMonth();
    const year = smallCalendarDate.getFullYear();
    const calendarGridEl = document.querySelector(".calendar .calendar-grid");
    document.getElementById("month-year").textContent = `${monthNames[month]} ${year}`;
    calendarGridEl.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        .map(day => `<div style="font-weight: bold;">${day}</div>`).join('');
    
    const visitDates = new Set(allVisits.map(visit => visit.date));

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDayOfMonth; i++) calendarGridEl.appendChild(document.createElement("div"));
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.classList.add("day");
        dayCell.textContent = day;

        const cellDate = new Date(year, month, day);
        const cellDateString = cellDate.toISOString().split('T')[0];

        if (visitDates.has(cellDateString)) {
            dayCell.classList.add('day-with-visit');
            const dot = document.createElement('div');
            dot.className = 'visit-dot';
            dayCell.appendChild(dot);
        }

        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add("today");
        }
        dayCell.addEventListener('click', () => {
             currentDate = new Date(year, month, day);
             smallCalendarDate = new Date(currentDate);
             renderMainView();
        });
        calendarGridEl.appendChild(dayCell);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await Promise.all([
            fetchLeadDetails(),
            fetchAndPopulateCompanyDropdown()
        ]);
        await fetchAllVisits();
        initializeAllListeners();

    } catch (error) {
        console.error("Failed to initialize the application:", error);
    }
});