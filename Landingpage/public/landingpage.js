'use strict';

// --- Global State ---
let currentView = 'week';
let currentDate = new Date();
let smallCalendarDate = new Date();
let allVisits = [];
let allCustomers = [];
let allLeads = [];
let currentUser = null;

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- Core Functions ---
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await fetchCurrentUser();
        if (currentUser) {
            await Promise.all([
                fetchAllLeads(),
                fetchAllCustomers(),
                fetchAllVisits()
            ]);
            initializeAllListeners();
        }
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        alert("There was a problem loading the application. Please try refreshing the page.");
    }
});

async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/auth/current-user');
        if (!response.ok) {
            if (response.status === 401) window.location.href = '/';
            throw new Error('Could not fetch user data.');
        }
        currentUser = await response.json();
    } catch (error) {
        console.error('Session error:', error);
        window.location.href = '/';
    }
}

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

async function fetchAllCustomers() {
    const customerDetailsSelect = document.getElementById('companydetails');
    try {
        const response = await fetch('/api/customer');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allCustomers = await response.json();
        const companyNames = [...new Set(allCustomers.map(c => c.name))];

        customerDetailsSelect.innerHTML = '<option value="">Select a Customer...</option>';
        companyNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            customerDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
    }
}

async function fetchAllLeads() {
    const leadDetailsSelect = document.getElementById('leaddetails');
    try {
        const response = await fetch('/api/lead');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allLeads = await response.json();

        leadDetailsSelect.innerHTML = '<option value="">Select a Lead...</option>';
        allLeads.forEach(lead => {
            const option = document.createElement('option');
            option.dataset.leadId = lead.id;
            option.value = lead.name;
            option.textContent = lead.location ? `${lead.name} - ${lead.location}` : lead.name;
            leadDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
    }
}

async function handleVisitFormSubmit(event, closeAfterSave = true) {
    event.preventDefault();
    const visitId = document.getElementById('visit-id-holder').value;
    const getFieldValue = id => document.getElementById(id)?.value.trim() || null;

    const visitData = {
        employee_id: getFieldValue('visit-employee-id'),
        date: getFieldValue('visit-date'),
        start_time: getFieldValue('starttime'),
        end_time: getFieldValue('endtime'),
        location: getFieldValue('visit-location'),
        purpose: getFieldValue('purpose'),
        status: document.getElementById('visit-status').value,
        notes: getFieldValue('completion-notes'),
        companyName: getFieldValue('companydetails'),
        person_name: getFieldValue('person-name-input'),
        lead_company_name: getFieldValue('leaddetails'),
        contact_details: getFieldValue('contact-details-input'),
    };

    if (!visitData.companyName && !visitData.lead_company_name) {
        return alert('You must select either a Customer or a Lead.');
    }
    if (visitData.companyName && !visitData.person_name) {
        return alert('Please select a specific contact person for the customer.');
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
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with ${response.status}`);
        }

        await fetchAllVisits();

        if (closeAfterSave) {
            closeform();
        } else {
            const savedDate = document.getElementById('visit-date').value;
            document.getElementById('visit-form').reset();
            if (currentUser) document.getElementById('visit-employee-id').value = currentUser.employee_id;
            document.getElementById('visit-date').value = savedDate;
            alert("Visit saved successfully. You can now add another.");
        }
    } catch (error) {
        console.error('Error saving/updating visit:', error);
        alert(`Failed to save visit: ${error.message}`);
    }
}

async function handleDeleteVisit(event) {
    event.preventDefault();
    const visitId = document.getElementById('visit-id-holder').value;
    if (!visitId || !confirm('Are you sure you want to delete this visit?')) return;

    try {
        const response = await fetch(`/api/visit/${visitId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete visit.');
        closeform();
        await fetchAllVisits();
    } catch (error) {
        console.error('Error deleting visit:', error);
        alert(error.message);
    }
}

async function handleLogout() {
    if (confirm("Are you sure you want to log out?")) {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                const errorData = await response.json();
                alert(`Logout failed: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred during logout. Please check the console.');
        }
    }
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

function renderSmallCalendar() {
    const month = smallCalendarDate.getMonth();
    const year = smallCalendarDate.getFullYear();
    const calendarGridEl = document.querySelector(".calendar .calendar-grid");
    document.getElementById("month-year").textContent = `${year}-${String(month + 1).padStart(2, '0')}`;
    calendarGridEl.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        .map((day, index) => `<div class="${index === 0 ? 'sunday-header' : ''}">${day}</div>`).join('');

    const visitDates = new Set(allVisits.map(visit => visit.date.split('T')[0]));
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) calendarGridEl.appendChild(document.createElement("div"));

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.classList.add("day");
        dayCell.textContent = day;
        const cellDate = new Date(year, month, day);
        const cellDateString = cellDate.toISOString().split('T')[0];
        if (cellDate.getDay() === 0) dayCell.style.color = 'red';

        if (visitDates.has(cellDateString)) {
            dayCell.classList.add('day-with-visit');
            const dot = document.createElement('div');
            dot.className = 'visit-indicator planned';
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

function formpopup(cellDate, cellTime) {
    const modal = document.getElementById('visit-modal');
    const visitForm = document.getElementById('visit-form');
    visitForm.reset();

    document.getElementById('visit-id-holder').value = '';
    document.getElementById('save-btn').style.display = 'inline-block';
    document.getElementById('save-add-another-btn').style.display = 'inline-block';
    document.getElementById('update-btn').style.display = 'none';
    document.getElementById('delete-visit-btn').style.display = 'none';

    const employeeIdInput = document.getElementById('visit-employee-id');
    if (currentUser && currentUser.employee_id) {
        employeeIdInput.value = currentUser.employee_id;
        employeeIdInput.readOnly = true;
    }

    document.getElementById('person-name-input').disabled = true;
    document.getElementById('customer-suggestions').innerHTML = '';
    document.getElementById('lead-person-name-input').disabled = true;
    document.getElementById('lead-contact-suggestions').innerHTML = '';

    if (cellDate) {
        document.getElementById('visit-date').value = new Date(cellDate).toISOString().split('T')[0];
    }
    if (cellTime) {
        document.getElementById('starttime').value = cellTime;
    }

    document.querySelector('.main-content').classList.add('blur-background');
    modal.style.display = 'flex';
}

function populateAndShowVisitForm(visit) {
    if (!visit) return;
    formpopup(visit.date, visit.start_time);

    document.getElementById('visit-id-holder').value = visit.visit_id;
    document.getElementById('visit-employee-id').value = visit.employee_id;
    document.getElementById('endtime').value = visit.end_time.substring(0, 5);
    document.getElementById('visit-location').value = visit.location;
    document.getElementById('purpose').value = visit.purpose;
    document.getElementById('visit-status').value = visit.status;
    document.getElementById('completion-notes').value = visit.notes || '';
    document.getElementById('visit-status').dispatchEvent(new Event('change'));

    const companyDropdown = document.getElementById('companydetails');
    const leadDropdown = document.getElementById('leaddetails');

    if (visit.Customer) {
        companyDropdown.value = visit.Customer.name;
        companyDropdown.dispatchEvent(new Event('change', {
            bubbles: true
        }));
        setTimeout(() => {
            const personInput = document.getElementById('person-name-input');
            personInput.value = visit.Customer.person_name;
            personInput.dispatchEvent(new Event('input', {
                bubbles: true
            }));
        }, 100);

    } else if (visit.Lead) {
        leadDropdown.value = visit.Lead.name;
        leadDropdown.dispatchEvent(new Event('change', {
            bubbles: true
        }));
    }

    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('save-add-another-btn').style.display = 'none';
    document.getElementById('update-btn').style.display = 'inline-block';
    document.getElementById('delete-visit-btn').style.display = 'inline-block';
}

function initializeAllListeners() {
    const mainViewContainer = document.getElementById('main-view-container');
    const tooltip = document.getElementById('visit-tooltip');

    document.getElementById('visit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'visit-modal') closeform();
    });

    mainViewContainer.addEventListener('click', async (e) => {
        const eventElement = e.target.closest('.event');
        if (eventElement) {
            const visitId = eventElement.getAttribute('data-visit-id');
            if (visitId) {
                const visitData = allVisits.find(v => v.visit_id == visitId);
                if (visitData) populateAndShowVisitForm(visitData);
            }
        }
    });
    
    mainViewContainer.addEventListener('mouseover', (e) => {
        const eventElement = e.target.closest('.event');
        if (eventElement) {
            const visitId = eventElement.getAttribute('data-visit-id');
            const visit = allVisits.find(v => v.visit_id == visitId);
            if (!visit) return;
            let title = visit.Customer ? visit.Customer.name : visit.Lead.name;
            let time = `${formatTimeForDisplay(visit.start_time)} - ${formatTimeForDisplay(visit.end_time)}`;
            let location = visit.location;
            tooltip.innerHTML = `
                <div class="tooltip-title">${title}</div>
                <div class="tooltip-body">
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Location:</strong> ${location}</p>
                </div>`;
            tooltip.classList.add('visible');
        }
    });

    mainViewContainer.addEventListener('mouseout', (e) => {
        const eventElement = e.target.closest('.event');
        if (eventElement) {
            tooltip.classList.remove('visible');
        }
    });

    mainViewContainer.addEventListener('mousemove', (e) => {
        if (tooltip.classList.contains('visible')) {
            tooltip.style.left = `${e.pageX + 15}px`;
            tooltip.style.top = `${e.pageY + 15}px`;
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

    const navigate = (direction) => {
        if (currentView === 'day') currentDate.setDate(currentDate.getDate() + direction);
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + (7 * direction));
        else currentDate.setMonth(currentDate.getMonth() + direction);
        smallCalendarDate = new Date(currentDate);
        renderMainView();
        renderSmallCalendar();
    };
    document.getElementById("prev-months").addEventListener("click", () => navigate(-1));
    document.getElementById("next-months").addEventListener("click", () => navigate(1));
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

    document.getElementById('visit-form').addEventListener('submit', (e) => handleVisitFormSubmit(e, true));
    document.getElementById('save-add-another-btn').addEventListener('click', (e) => handleVisitFormSubmit(e, false));
    document.getElementById('update-btn').addEventListener('click', (e) => handleVisitFormSubmit(e, true));
    document.getElementById('delete-visit-btn').addEventListener('click', handleDeleteVisit);

    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    const companyDropdown = document.getElementById('companydetails');
    const leadDropdown = document.getElementById('leaddetails');
    const personNameInput = document.getElementById('person-name-input');
    const personSuggestions = document.getElementById('customer-suggestions');
    const leadPersonNameInput = document.getElementById('lead-person-name-input');
    const contactInput = document.getElementById('contact-details-input');

    // ** --- THIS IS THE MODIFIED EVENT LISTENER --- **
    companyDropdown.addEventListener('change', (e) => {
        const selectedCompanyName = e.target.value;
        personNameInput.value = '';
        personSuggestions.innerHTML = '';
        contactInput.value = '';
        leadDropdown.value = '';
        leadPersonNameInput.value = '';
        leadPersonNameInput.disabled = true;

        if (selectedCompanyName) {
            const peopleForCompany = allCustomers.filter(c => c.name === selectedCompanyName);
            peopleForCompany.forEach(person => {
                const option = document.createElement('option');
                option.value = person.person_name;
                personSuggestions.appendChild(option);
            });
            personNameInput.disabled = false;
            personNameInput.placeholder = 'Select a person';

            // **CHANGE START: Auto-select if only one person**
            if (peopleForCompany.length === 1) {
                const singlePerson = peopleForCompany[0];
                personNameInput.value = singlePerson.person_name;
                // Manually trigger the 'input' event to populate other fields
                personNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // **CHANGE END**

        } else {
            personNameInput.disabled = true;
            personNameInput.placeholder = 'Select company first';
        }
    });

    personNameInput.addEventListener('input', (e) => {
        const selectedPersonName = e.target.value;
        const selectedCompanyName = companyDropdown.value;
        const selectedCustomer = allCustomers.find(c => c.name === selectedCompanyName && c.person_name === selectedPersonName);

        if (selectedCustomer) {
            contactInput.value = selectedCustomer.contact_details || '';
            document.getElementById('visit-location').value = selectedCustomer.Location?.name || '';
        } else {
            contactInput.value = '';
        }
    });

    leadDropdown.addEventListener('change', (e) => {
        const selectedLeadName = e.target.value;
        const selectedLead = allLeads.find(l => l.name === selectedLeadName);
        companyDropdown.value = '';
        personNameInput.value = '';
        personNameInput.disabled = true;

        if (selectedLead) {
            leadPersonNameInput.value = selectedLead.person_name || '';
            leadPersonNameInput.disabled = false;
            contactInput.value = selectedLead.contact_details || '';
            document.getElementById('visit-location').value = selectedLead.location || '';
        } else {
            leadPersonNameInput.value = '';
            leadPersonNameInput.disabled = true;
            contactInput.value = '';
        }
    });

    document.getElementById('visit-status').addEventListener('change', (e) => {
        document.getElementById('visits-completed').style.display = (e.target.value === 'Completed') ? 'block' : 'none';
    });
}


function closeform() {
    document.getElementById('visit-modal').style.display = "none";
    document.querySelector('.main-content').classList.remove('blur-background');
}

function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    let formattedHour = h % 12;
    if (formattedHour === 0) {
        formattedHour = 12;
    }
    return `${formattedHour}:${minute} ${ampm}`;
}

function formatHourTo12(hour) {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
}

function createEventDiv(visit) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${visit.status.replace(/\s+/g, '-').toLowerCase()}`;
    eventDiv.setAttribute('data-visit-id', visit.visit_id);

    let displayName = 'Unknown Visit';
    if (visit.Customer) {
        displayName = visit.Customer.name;
    } else if (visit.Lead) {
        displayName = visit.Lead.name;
    }
    eventDiv.textContent = `${displayName} @ ${formatTimeForDisplay(visit.start_time)}`;

    return eventDiv;
}


function updateHeaders() {
    const viewDateRange = document.getElementById('view-date-range');
    const year = currentDate.getFullYear();
    const month = monthNames[currentDate.getMonth()];
    if (currentView === 'month') {
        viewDateRange.textContent = `${month} ${year}`;
    } else if (currentView === 'week') {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        viewDateRange.textContent = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${year}`;
    } else if (currentView === 'day') {
        viewDateRange.textContent = `${currentDate.getDate()} ${month} ${year}`;
    }
}

function renderDayWeekView(numberOfDays) {
    const viewContainer = document.getElementById('main-view-container');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStartsOn = new Date(currentDate);
    if (numberOfDays === 7) {
        weekStartsOn.setDate(currentDate.getDate() - currentDate.getDay());
    }
    weekStartsOn.setHours(0, 0, 0, 0);

    const startDateStr = weekStartsOn.toISOString().split('T')[0];
    const tempEndDate = new Date(weekStartsOn);
    tempEndDate.setDate(weekStartsOn.getDate() + numberOfDays - 1);
    const endDateStr = tempEndDate.toISOString().split('T')[0];
    
    const visibleVisits = allVisits.filter(visit => {
        const visitDateStr = visit.date.split('T')[0];
        return visitDateStr >= startDateStr && visitDateStr <= endDateStr;
    });

    const visitsByTimeSlot = {};
    visibleVisits.forEach(visit => {
        const visitHour = parseInt(visit.start_time.substring(0, 2), 10);
        const timeSlotId = `${visit.date.split('T')[0]}_${String(visitHour).padStart(2, '0')}`;
        if (!visitsByTimeSlot[timeSlotId]) {
            visitsByTimeSlot[timeSlotId] = [];
        }
        visitsByTimeSlot[timeSlotId].push(visit);
    });
    
    let dayHeadersHTML = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < numberOfDays; i++) {
        const currentDateHeader = new Date(weekStartsOn);
        currentDateHeader.setDate(weekStartsOn.getDate() + i);
        const dayName = dayNames[currentDateHeader.getDay()];
        const dayNumberClass = (currentDateHeader.toDateString() === today.toDateString()) ? 'day-number today' : 'day-number';
        dayHeadersHTML += `<div class="day-header-cell"><div class="day-name">${dayName}</div><div class="${dayNumberClass}">${currentDateHeader.getDate()}</div></div>`;
    }
    
    let timeGridHTML = '';
    for (let i = 0; i < 24; i++) {
        timeGridHTML += `<div class="time-label">${formatHourTo12(i)}</div>`;
        for (let j = 0; j < numberOfDays; j++) {
            const dateForSlot = new Date(weekStartsOn);
            dateForSlot.setDate(weekStartsOn.getDate() + j);
            const timeSlotId = `${dateForSlot.toISOString().split('T')[0]}_${String(i).padStart(2, '0')}`;
            timeGridHTML += `<div class="grid-cell" data-time-slot="${timeSlotId}"><div class="event-wrapper"></div></div>`;
        }
    }

    viewContainer.innerHTML = `
        <div class="day-week-view-wrapper">
             <div class="day-headers" style="grid-template-columns: 60px repeat(${numberOfDays}, 1fr);">
                <div class="day-header-cell"></div>
                ${dayHeadersHTML}
            </div>
            <div class="time-grid-wrapper">
                <div class="time-grid" style="grid-template-columns: 60px repeat(${numberOfDays}, 1fr);">
                    ${timeGridHTML}
                </div>
            </div>
        </div>`;

    for (const timeSlotId in visitsByTimeSlot) {
        const targetCell = viewContainer.querySelector(`[data-time-slot="${timeSlotId}"]`);
        if (targetCell) {
            const wrapper = targetCell.querySelector('.event-wrapper');
            wrapper.innerHTML = '';
            visitsByTimeSlot[timeSlotId].forEach(visit => {
                wrapper.appendChild(createEventDiv(visit));
            });
        }
    }
    
    initializeGridCellListeners(weekStartsOn, numberOfDays);
}


function renderMonthView() {
    const viewContainer = document.getElementById('main-view-container');
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const visitsForMonth = allVisits.filter(visit => {
        const visitDate = new Date(visit.date);
        return visitDate.getFullYear() === year && visitDate.getMonth() === month;
    });

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

    visitsForMonth.forEach(visit => {
        const dateStr = visit.date.split('T')[0];
        const cell = viewContainer.querySelector(`[data-date="${dateStr}"]`);
        if (cell) {
            const eventDiv = createEventDiv(visit);
            eventDiv.className = `month-event ${visit.status.replace(/\s+/g, '-').toLowerCase()}`;
            cell.appendChild(eventDiv);
        }
    });
}

function initializeGridCellListeners(weekStartsOn, numberOfDays) {
    document.querySelectorAll('.grid-cell').forEach((cell) => {
        cell.addEventListener('click', function(e) {
            if (e.target.closest('.event')) return; 
            
            const timeSlot = this.dataset.timeSlot;
            const [dateStr, hourStr] = timeSlot.split('_');
            const clickedDate = new Date(dateStr + 'T00:00:00'); 
            const timeForPopup = `${hourStr}:00`;

            formpopup(clickedDate, timeForPopup);
        });
    });
}
