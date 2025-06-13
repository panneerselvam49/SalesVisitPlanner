'use strict';

// --- Global State ---
let currentView = 'week';
let currentDate = new Date();
let smallCalendarDate = new Date();
let allVisits = [];
let allMasterCustomers = [];
let allLeads = [];
let allContacts = [];
let currentUser = null;

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- Core Functions ---
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await fetchCurrentUser();
        if (currentUser) {
            await Promise.all([
                fetchAllLeads(),
                fetchAllMasterCustomers(),
                fetchAllContacts(),
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

async function fetchAllMasterCustomers() {
    const customerDetailsSelect = document.getElementById('companydetails');
    try {
        const response = await fetch('/api/customermaster');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allMasterCustomers = await response.json();

        customerDetailsSelect.innerHTML = '<option value="">Select a Customer</option>';
        allMasterCustomers.forEach(master => {
            const option = document.createElement('option');
            option.value = master.name;
            option.dataset.masterId = master.id;
            option.dataset.locationName = master.Location?.name || '';
            option.textContent = master.name;
            customerDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching master customers:', error);
    }
}

async function fetchAllContacts() {
    try {
        const response = await fetch('/api/customer');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allContacts = await response.json();
    } catch (error) {
        console.error('Error fetching contacts:', error);
        allContacts = [];
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

async function fetchAllLeads() {
    const leadDetailsSelect = document.getElementById('leaddetails');
    try {
        const response = await fetch('/api/lead');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allLeads = await response.json();

        leadDetailsSelect.innerHTML = '<option value="">Select a Lead</option>';
        allLeads.forEach(lead => {
            const option = document.createElement('option');
            option.dataset.leadId = lead.id;
            option.value = lead.CustomerMaster ? lead.CustomerMaster.name : 'Unknown Lead';
            option.textContent = option.value;
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

    const selectedCompanyOption = document.getElementById('companydetails').selectedOptions[0];
    const selectedLeadOption = document.getElementById('leaddetails').selectedOptions[0];

    const visitData = {
        employee_id: getFieldValue('visit-employee-id'),
        date: getFieldValue('visit-date'),
        start_time: getFieldValue('starttime'),
        end_time: getFieldValue('endtime'),
        purpose: getFieldValue('purpose'),
        status: document.getElementById('visit-status').value,
        notes: getFieldValue('completion-notes'),
        customerMasterName: getFieldValue('companydetails') || (getFieldValue('leaddetails') ? selectedLeadOption.value : null),
        person_name: getFieldValue('companydetails') ? getFieldValue('person-name-input') : getFieldValue('lead-person-name-input'),
        locationName: getFieldValue('companydetails') ? selectedCompanyOption.dataset.locationName : getFieldValue('visit-location'),
        contact_details: getFieldValue('contact-details-input'),
    };

    visitData.location = visitData.locationName;

    if (!visitData.customerMasterName) {
        return alert('You must select either a Customer or a Lead.');
    }
    if (!visitData.person_name) {
        return alert('Please provide a specific contact person.');
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

        await Promise.all([fetchAllVisits(), fetchAllContacts()]);

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

function populateAndShowVisitForm(visit) {
    if (!visit) return;
    formpopup(visit.date, visit.start_time);

    document.getElementById('visit-id-holder').value = visit.visit_id;
    document.getElementById('visit-employee-id').value = visit.employee_id;
    document.getElementById('endtime').value = visit.end_time ? visit.end_time.substring(0, 5) : '';
    document.getElementById('purpose').value = visit.purpose;
    document.getElementById('visit-status').value = visit.status;
    document.getElementById('completion-notes').value = visit.notes || '';
    document.getElementById('visit-status').dispatchEvent(new Event('change'));

    if (visit.Customer && visit.Customer.CustomerMaster) {
        const companyDropdown = document.getElementById('companydetails');
        const master = visit.Customer.CustomerMaster;
        const contact = visit.Customer;
        
        companyDropdown.value = master.name;
        companyDropdown.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            const personInput = document.getElementById('person-name-input');
            const contactInput = document.getElementById('contact-details-input');
            const locationInput = document.getElementById('visit-location');

            personInput.value = contact.person_name;
            contactInput.value = contact.contact_details || '';
            locationInput.value = master.Location?.name || '';
        }, 150);
    } else if (visit.Lead && visit.Lead.CustomerMaster) {
        const leadDropdown = document.getElementById('leaddetails');
        const lead = visit.Lead;
        
        leadDropdown.value = lead.CustomerMaster.name;
        leadDropdown.dispatchEvent(new Event('change', { bubbles: true }));
    }

    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('save-add-another-btn').style.display = 'none';
    document.getElementById('update-btn').style.display = 'inline-block';
    document.getElementById('delete-visit-btn').style.display = 'inline-block';
}

function initializeAllListeners() {
    const companyDropdown = document.getElementById('companydetails');
    const personNameInput = document.getElementById('person-name-input');
    const contactInput = document.getElementById('contact-details-input');
    const locationInput = document.getElementById('visit-location');
    const suggestionsDatalist = document.getElementById('customer-suggestions');
    
    const leadDropdown = document.getElementById('leaddetails');
    const leadPersonNameInput = document.getElementById('lead-person-name-input');

    companyDropdown.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const masterId = selectedOption.dataset.masterId;
        const locationName = selectedOption.dataset.locationName;

        personNameInput.value = '';
        contactInput.value = '';
        leadDropdown.value = '';
        leadPersonNameInput.value = '';
        locationInput.value = locationName || '';
        suggestionsDatalist.innerHTML = '';

        if (masterId) {
            personNameInput.disabled = false;
            personNameInput.placeholder = 'Select or type a contact name';
            
            const contactsForMaster = allContacts.filter(c => c.CustomerMaster && c.CustomerMaster.id == masterId);

            if (contactsForMaster.length === 1) {
                const singleContact = contactsForMaster[0];
                personNameInput.value = singleContact.person_name;
                contactInput.value = singleContact.contact_details || '';
            } else {
                contactsForMaster.forEach(contact => {
                    const option = document.createElement('option');
                    option.value = contact.person_name;
                    option.dataset.contactDetails = contact.contact_details || '';
                    suggestionsDatalist.appendChild(option);
                });
            }
        } else {
            personNameInput.disabled = true;
            personNameInput.placeholder = 'Select a company first';
        }
    });
    
    leadDropdown.addEventListener('change', (e) => {
        const selectedLeadName = e.target.value;
        const selectedLead = allLeads.find(l => l.CustomerMaster && l.CustomerMaster.name === selectedLeadName);

        companyDropdown.value = '';
        personNameInput.value = '';
        leadPersonNameInput.value = '';
        contactInput.value = '';
        locationInput.value = '';

        if (selectedLead) {
            leadPersonNameInput.value = selectedLead.person_name || '';
            contactInput.value = selectedLead.contact_details || '';
        }
    });

    personNameInput.addEventListener('input', (e) => {
        const selectedPersonName = e.target.value;
        const matchingOption = Array.from(suggestionsDatalist.options).find(opt => opt.value === selectedPersonName);
        if (matchingOption) {
            contactInput.value = matchingOption.dataset.contactDetails || '';
        } else {
            contactInput.value = '';
        }
    });
    
    const mainViewContainer = document.getElementById('main-view-container');
    const visitPopup = document.getElementById('visit-details-popup');
    
    document.getElementById('visit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'visit-modal') closeform();
    });

    mainViewContainer.addEventListener('click', (e) => {
        const eventElement = e.target.closest('.event, .month-event');
        if (eventElement) {
            const visitId = eventElement.getAttribute('data-visit-id');
            if (visitId) {
                const visitData = allVisits.find(v => v.visit_id == visitId);
                if (visitData) populateAndShowVisitForm(visitData);
            }
        }
    });
    
    // --- CORRECTED HOVER LOGIC ---
    mainViewContainer.addEventListener('mouseover', (e) => {
        const eventElement = e.target.closest('.event, .month-event');
        if (eventElement) {
            const visitId = eventElement.getAttribute('data-visit-id');
            const visit = allVisits.find(v => v.visit_id == visitId);
            if (!visit) return;
            
            let customerName = 'N/A';
            if (visit.Customer && visit.Customer.CustomerMaster) {
                customerName = visit.Customer.CustomerMaster.name;
            } else if (visit.Lead && visit.Lead.CustomerMaster) {
                customerName = visit.Lead.CustomerMaster.name;
            }

            const startTime = formatTimeForDisplay(visit.start_time);
            const location = visit.location;

            visitPopup.innerHTML = `
                <div class="popup-title">${customerName}</div>
                <div class="popup-info">
                    <div><strong>Location:</strong> ${location}</div>
                    <div><strong>Time:</strong> ${startTime}</div>
                </div>
            `;
            
            visitPopup.style.left = `${e.pageX + 15}px`;
            visitPopup.style.top = `${e.pageY + 15}px`;
            visitPopup.classList.add('visible');
        }
    });

    mainViewContainer.addEventListener('mouseout', (e) => {
        if (e.target.closest('.event, .month-event')) {
            visitPopup.classList.remove('visible');
        }
    });
    // --- END OF CORRECTED HOVER LOGIC ---

    document.querySelectorAll('#calendar-view-toggle .view-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('#calendar-view-toggle .view-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentView = this.getAttribute('data-view');
            renderMainView();
        });
    });

    const navigate = (direction) => {
        const newDate = new Date(currentDate);
        if (currentView === 'day') newDate.setDate(newDate.getDate() + direction);
        else if (currentView === 'week') newDate.setDate(newDate.getDate() + (7 * direction));
        else newDate.setMonth(newDate.getMonth() + direction);
        currentDate = newDate;
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
    
     document.getElementById('visit-status').addEventListener('change', (e) => {
        document.getElementById('visits-completed').style.display = (e.target.value === 'Completed') ? 'block' : 'none';
    });
}

function createEventDiv(visit) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${visit.status.replace(/\s+/g, '-').toLowerCase()}`;
    eventDiv.setAttribute('data-visit-id', visit.visit_id);
    return eventDiv;
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
        
        const cellDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = cellDateString;

        if (new Date(cellDateString.replace(/-/g, '/')).getDay() === 0) {
            dayCell.style.color = 'red';
        }

        if (visitDates.has(cellDateString)) {
            dayCell.classList.add('day-with-visit');
        }

        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add("today");
        }

        dayCell.addEventListener('click', function() {
            const dateToSet = new Date(this.dataset.date.replace(/-/g, '/'));
            currentDate = dateToSet;
            smallCalendarDate = new Date(dateToSet);
            renderMainView();
            formpopup(this.dataset.date, null);
        });
        calendarGridEl.appendChild(dayCell);
    }
}

function formpopup(cellDateString, cellTime) {
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
    
    if (cellDateString) {
        document.getElementById('visit-date').value = cellDateString;
    }
    if (cellTime) {
        document.getElementById('starttime').value = cellTime;
    }

    document.querySelector('.main-content').classList.add('blur-background');
    modal.style.display = 'flex';
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

function updateHeaders() {
    const viewDateRange = document.getElementById('view-date-range');
    const year = currentDate.getFullYear();
    const month = monthNames[currentDate.getMonth()];
    if (currentView === 'month') {
        viewDateRange.textContent = `${month} ${year}`;
    } else if (currentView === 'week') {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - weekStart.getDay());
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
        weekStartsOn.setDate(currentDate.getDate() - weekStartsOn.getDay());
    }
    weekStartsOn.setHours(0, 0, 0, 0);

    const startDate = new Date(weekStartsOn);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + numberOfDays - 1);
    
    const visibleVisits = allVisits.filter(visit => {
        const visitDate = new Date(visit.date.replace(/-/g, '/'));
        return visitDate >= startDate && visitDate <= endDate;
    });

    const visitsByTimeSlot = {};
    visibleVisits.forEach(visit => {
        if (!visit.start_time) return;
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
            const dateStr = `${dateForSlot.getFullYear()}-${String(dateForSlot.getMonth() + 1).padStart(2, '0')}-${String(dateForSlot.getDate()).padStart(2, '0')}`;
            const timeSlotId = `${dateStr}_${String(i).padStart(2, '0')}`;
            timeGridHTML += `<div class="grid-cell" data-time-slot="${timeSlotId}"><div class="event-wrapper"></div></div>`;
        }
    }

    viewContainer.innerHTML = `
        <div class="day-week-view-wrapper">
             <div class="day-headers" style="grid-template-columns: 60px repeat(${numberOfDays}, 1fr);">
                <div class="day-header-cell" style="border: none;"></div>
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
    
    initializeGridCellListeners();
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
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let todayClass = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 'today' : '';
        dayCellsHTML += `
            <div class="month-day-cell ${todayClass}" data-date="${dateStr}">
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
            eventDiv.className += ' month-event';
            cell.appendChild(eventDiv);
        }
    });
}

function initializeGridCellListeners() {
    document.querySelectorAll('.grid-cell').forEach((cell) => {
        cell.addEventListener('click', function(e) {
            if (e.target.closest('.event')) return; 
            
            const timeSlot = this.dataset.timeSlot;
            const [dateStr, hourStr] = timeSlot.split('_');
            const timeForPopup = `${hourStr}:00`;

            formpopup(dateStr, timeForPopup);
        });
    });
}
