let currentView = 'week';
let currentDate = new Date();
let smallCalendarDate = new Date();
let allVisits = [];
let currentCompanyCustomers = [];
let currentLeadContacts = [];
// Global variable to store the logged-in user's data
let currentUser = null;

// Function to fetch the current user's data from the server
async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/auth/current-user');
        if (!response.ok) {
            // If user is not authorized (e.g., session expired), redirect to login
            if (response.status === 401) window.location.href = '/';
            throw new Error('Could not fetch user data.');
        }
        currentUser = await response.json();
    } catch (error) {
        console.error('Session error:', error);
        // Redirect to login page on any error to ensure security
        window.location.href = '/';
    }
}

function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
            option.dataset.leadId = lead.lead_id;
            option.value = lead.company_name;
            option.textContent = lead.location ? `${lead.company_name} - ${lead.location}` : lead.company_name;
            leadDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
    }
}

async function fetchAndPopulateCompanyDropdown() {
    const companyDetailsSelect = document.getElementById('companydetails');
    try {
        const response = await fetch('/api/company');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const companies = await response.json();
        
        companyDetailsSelect.innerHTML = '<option value="">Select a Company...</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.company_name; 
            option.textContent = `${company.company_name} (${company.location})`;
            companyDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching companies for dropdown:', error);
    }
}

function createEventDiv(visit) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${visit.status.replace(/\s+/g, '-').toLowerCase()}`;
    eventDiv.setAttribute('data-visit-id', visit.visit_id);

    let displayName = 'Unknown';
    if (visit.Customer) {
        displayName = visit.Customer.customer_name || visit.Customer.companyName;
    } else if (visit.Lead) {
        displayName = visit.Lead.company_name;
    }

    const displayTime = formatTimeForDisplay(visit.start_time);
    eventDiv.textContent = `${displayName} @ ${displayTime}`;
    
    return eventDiv;
}

// This function now correctly populates the employee ID when the form opens
function formpopup(cellDate, cellTime) {
    const modal = document.getElementById('visit-modal');
    const visitForm = document.getElementById('visit-form');
    visitForm.reset();
    document.getElementById('visit-id-holder').value = '';
    
    document.getElementById('save-btn').style.display = 'inline-block';
    document.getElementById('update-btn').style.display = 'none';
    document.getElementById('delete-visit-btn').style.display = 'none';

    // Auto-fill and disable the employee ID field
    const employeeIdInput = document.getElementById('visit-employee-id');
    if (currentUser && currentUser.employee_id) {
        employeeIdInput.value = currentUser.employee_id;
        employeeIdInput.readOnly = true; 
    } else {
        employeeIdInput.value = 'Error: Not Logged In';
        employeeIdInput.readOnly = true;
    }
    
    // Reset all interactive form fields
    document.getElementById('person-name-input').disabled = true;
    document.getElementById('customer-suggestions').innerHTML = '';
    document.getElementById('lead-person-name-input').disabled = true;
    document.getElementById('lead-contact-suggestions').innerHTML = '';

    const saveAndAddButton = document.getElementById('save-add-another-btn');
    const clickedDateString = new Date(cellDate).toISOString().split('T')[0];
    
    saveAndAddButton.style.display = allVisits.some(visit => visit.date === clickedDateString) ? 'inline-block' : 'none';

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

function populateAndShowVisitForm(visit) {
    if (!visit) return;
    formpopup(visit.date, formatTimeForDisplay(visit.start_time));
    
    document.getElementById('visit-id-holder').value = visit.visit_id;
    document.getElementById('visit-employee-id').value = visit.employee_id;
    
    document.getElementById('endtime').value = formatTimeForDisplay(visit.end_time);
    document.getElementById('visit-location').value = visit.location;
    document.getElementById('purpose').value = visit.purpose;
    document.getElementById('visit-status').value = visit.status;
    document.getElementById('completion-notes').value = visit.notes || '';
    document.getElementById('visit-status').dispatchEvent(new Event('change'));

    const companyDropdown = document.getElementById('companydetails');
    const leadDropdown = document.getElementById('leaddetails');

    if (visit.visit_source === 'CUSTOMER' && visit.Customer) {
        companyDropdown.value = visit.Customer.companyName;
        companyDropdown.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            const personInput = document.getElementById('person-name-input');
            personInput.value = visit.Customer.customer_name;
            personInput.dispatchEvent(new Event('input', { bubbles: true }));
        }, 500); 

    } else if (visit.visit_source === 'LEAD' && visit.Lead) {
        leadDropdown.value = visit.Lead.company_name;
        leadDropdown.dispatchEvent(new Event('change', { bubbles: true }));
        document.getElementById('contact-details-input').value = 'Please re-select a contact person';
    }
    
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('save-add-another-btn').style.display = 'none';
    document.getElementById('update-btn').style.display = 'inline-block';
    document.getElementById('delete-visit-btn').style.display = 'inline-block';
}

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
        companyName: getFieldValue('companydetails'),
        lead_company_name: getFieldValue('leaddetails'),
        person_name: null, 
        contact_details: getFieldValue('contact-details-input')
    };

    if (visitData.companyName) {
        visitData.person_name = getFieldValue('person-name-input');
        if (!visitData.person_name) return alert('Please select a specific person for the company.');
    } else if (visitData.lead_company_name) {
        visitData.person_name = getFieldValue('lead-person-name-input');
        if (!visitData.person_name) return alert('Please select a specific contact for the lead.');
    } else {
        return alert('You must select either a Company or a Lead.');
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
            alert("Visit saved. You can now add another.");
        }
    } catch (error) {
        console.error('Error saving/updating visit:', error);
        alert(`Failed to save visit: ${error.message}`);
    }
}

// Main initialization logic
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await fetchCurrentUser();
        
        if (currentUser) {
            await Promise.all([
                fetchLeadDetails(),
                fetchAndPopulateCompanyDropdown(),
                fetchAllVisits()
            ]);
            initializeAllListeners();
        }
    } catch (error) {
        console.error("Failed to initialize the application:", error);
    }
});

// Helper and rendering functions
function closeform() {
    document.getElementById('visit-modal').style.display = "none";
    document.querySelector('.main-content').classList.remove('blur-background');
}

function renderMainView() {
    updateHeaders();
    switch (currentView) {
        case 'day': renderDayWeekView(1); break;
        case 'month': renderMonthView(); break;
        case 'week': default: renderDayWeekView(7); break;
    }
}

function updateHeaders() {
    const viewTitle = document.getElementById('view-title');
    const viewDateRange = document.getElementById('view-date-range');
    const year = currentDate.getFullYear();
    const month = monthNames[currentDate.getMonth()];
    if (currentView === 'month') {
        viewTitle.textContent = 'Month View';
        viewDateRange.textContent = `${month} ${year}`;
    } else if (currentView === 'week') {
        viewTitle.textContent = 'Week View';
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        viewDateRange.textContent = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${year}`;
    } else if (currentView === 'day') {
        viewTitle.textContent = 'Day View';
        viewDateRange.textContent = `${currentDate.getDate()} ${month} ${year}`;
    }
}

function renderDayWeekView(numberOfDays) {
    const viewContainer = document.getElementById('main-view-container');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStartsOn = new Date(currentDate);
    if (numberOfDays === 7) weekStartsOn.setDate(currentDate.getDate() - currentDate.getDay());
    weekStartsOn.setHours(0, 0, 0, 0);
    let dayHeadersHTML = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < numberOfDays; i++) {
        const currentDateHeader = new Date(weekStartsOn);
        currentDateHeader.setDate(weekStartsOn.getDate() + i);
        const dayIndex = (weekStartsOn.getDay() + i) % 7;
        const dayName = dayNames[dayIndex];
        const dayNumberClass = (currentDateHeader.getTime() === today.getTime()) ? 'day-number today' : 'day-number';
        dayHeadersHTML += `<div class="day-header-cell"><div class="day-name">${dayName}</div><div class="${dayNumberClass}">${currentDateHeader.getDate()}</div></div>`;
    }
    let timeGridHTML = '';
    for (let i = 0; i < 24; i++) {
        timeGridHTML += `<div class="time-label">${i}:00</div>`;
        for (let j = 0; j < numberOfDays; j++) {
            const dateForSlot = new Date(weekStartsOn);
            dateForSlot.setDate(weekStartsOn.getDate() + j);
            const timeSlotId = `${dateForSlot.toISOString().split('T')[0]}_${String(i).padStart(2, '0')}`;
            timeGridHTML += `<div class="grid-cell" data-time-slot="${timeSlotId}"><div class="event-wrapper"></div></div>`;
        }
    }
    viewContainer.innerHTML = `<div class="day-headers" style="grid-template-columns: 60px repeat(${numberOfDays}, 1fr);"><div class="day-header-cell"></div>${dayHeadersHTML}</div><div class="time-grid-wrapper"><div class="time-grid" style="grid-template-columns: 60px repeat(${numberOfDays}, 1fr);">${timeGridHTML}</div></div>`;
    const visitsByTimeSlot = {};
    allVisits.forEach(visit => {
        const visitDate = new Date(visit.date);
        visitDate.setHours(0,0,0,0);
        const viewEndDate = new Date(weekStartsOn);
        viewEndDate.setDate(weekStartsOn.getDate() + numberOfDays - 1);
        if(visitDate >= weekStartsOn && visitDate <= viewEndDate) {
            const visitHour = parseInt(visit.start_time.substring(0, 2), 10);
            const timeSlotId = `${visit.date.split('T')[0]}_${String(visitHour).padStart(2, '0')}`;
            if (!visitsByTimeSlot[timeSlotId]) visitsByTimeSlot[timeSlotId] = [];
            visitsByTimeSlot[timeSlotId].push(visit);
        }
    });
    for (const timeSlotId in visitsByTimeSlot) {
        const targetCell = viewContainer.querySelector(`[data-time-slot="${timeSlotId}"]`);
        if (targetCell) {
            const wrapper = targetCell.querySelector('.event-wrapper');
            visitsByTimeSlot[timeSlotId].forEach(visit => wrapper.appendChild(createEventDiv(visit)));
        }
    }
    initializeGridCellListeners(weekStartsOn, numberOfDays);
}

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

async function handleDeleteVisit(event) {
    event.preventDefault();
    const visitId = document.getElementById('visit-id-holder').value;
    if (!visitId || !confirm('Are you sure you want to delete this visit?')) return;
    try {
        const response = await fetch(`/api/visit/${visitId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete visit.');
        closeform();
        fetchAllVisits();
    } catch (error) {
        console.error('Error deleting visit:', error);
        alert(error.message);
    }
}

function initializeAllListeners() {
    document.getElementById('visit-modal').addEventListener('click', function(e) { if (e.target === this) closeform(); });
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
    document.getElementById('main-view-container').addEventListener('click', async function(e) {
        const eventElement = e.target.closest('.event, .month-event');
        if (eventElement) {
            const visitId = eventElement.getAttribute('data-visit-id');
            if (visitId) {
                const visitData = allVisits.find(v => v.visit_id == visitId);
                if (visitData) populateAndShowVisitForm(visitData);
                else alert('Could not load visit details.');
            }
        }
    });
    const companyDropdown = document.getElementById('companydetails');
    const leadDropdown = document.getElementById('leaddetails');
    const personNameInput = document.getElementById('person-name-input');
    const suggestionsDatalist = document.getElementById('customer-suggestions');
    const customerIdHolder = document.getElementById('customer-id-holder');
    const leadPersonNameInput = document.getElementById('lead-person-name-input');
    const leadSuggestionsDatalist = document.getElementById('lead-contact-suggestions');
    const leadContactIdHolder = document.getElementById('lead-contact-id-holder');
    const contactInput = document.getElementById('contact-details-input');
    companyDropdown.addEventListener('change', async (e) => {
        const companyName = e.target.value;
        personNameInput.value = '';
        personNameInput.disabled = true;
        suggestionsDatalist.innerHTML = '';
        contactInput.value = '';
        customerIdHolder.value = '';
        leadDropdown.value = '';
        leadPersonNameInput.value = '';
        leadPersonNameInput.disabled = true;
        leadSuggestionsDatalist.innerHTML = '';
        leadContactIdHolder.value = '';
        if (companyName) {
            personNameInput.placeholder = 'Loading people...';
            try {
                const response = await fetch(`/api/company/${companyName}/customers`);
                if (!response.ok) throw new Error(`Server responded with ${response.status}`);
                const customers = await response.json();
                currentCompanyCustomers = customers;
                customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.customer_name;
                    suggestionsDatalist.appendChild(option);
                });
                personNameInput.placeholder = 'Type or select a person';
                personNameInput.disabled = false;
            } catch (error) {
                console.error('Failed to fetch customers:', error);
                personNameInput.placeholder = 'Error loading people';
                personNameInput.disabled = false;
            }
        } else {
            personNameInput.placeholder = 'Select company to see suggestions';
        }
    });
    personNameInput.addEventListener('input', (e) => {
        const inputValue = e.target.value;
        const options = suggestionsDatalist.options;
        let matchFound = false;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === inputValue) {
                const selectedCustomer = currentCompanyCustomers.find(c => c.customer_name === inputValue);
                if (selectedCustomer) {
                    contactInput.value = selectedCustomer.contact_details || '';
                    customerIdHolder.value = selectedCustomer.customer_id;
                    matchFound = true;
                }
                break;
            }
        }
        if (!matchFound) {
            contactInput.value = '';
            customerIdHolder.value = '';
        }
    });
    leadDropdown.addEventListener('change', async (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const leadId = selectedOption.dataset.leadId;
        leadPersonNameInput.value = '';
        leadPersonNameInput.disabled = true;
        leadSuggestionsDatalist.innerHTML = '';
        contactInput.value = '';
        leadContactIdHolder.value = '';
        companyDropdown.value = '';
        personNameInput.value = '';
        personNameInput.disabled = true;
        suggestionsDatalist.innerHTML = '';
        customerIdHolder.value = '';
        if (leadId) {
            leadPersonNameInput.placeholder = 'Loading contacts...';
            try {
                const response = await fetch(`/api/lead/${leadId}/contacts`);
                if (!response.ok) throw new Error(`Server responded with ${response.status}`);
                const contacts = await response.json();
                currentLeadContacts = contacts;
                contacts.forEach(contact => {
                    const option = document.createElement('option');
                    option.value = contact.contact_name;
                    leadSuggestionsDatalist.appendChild(option);
                });
                leadPersonNameInput.placeholder = 'Type or select a contact';
                leadPersonNameInput.disabled = false;
            } catch (error) {
                console.error('Failed to fetch lead contacts:', error);
                leadPersonNameInput.placeholder = 'Error loading contacts';
                leadPersonNameInput.disabled = false;
            }
        } else {
            leadPersonNameInput.placeholder = 'Select lead to see suggestions';
        }
    });
    leadPersonNameInput.addEventListener('input', (e) => {
        const inputValue = e.target.value;
        const options = leadSuggestionsDatalist.options;
        let matchFound = false;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === inputValue) {
                const selectedContact = currentLeadContacts.find(c => c.contact_name === inputValue);
                if (selectedContact) {
                    contactInput.value = selectedContact.contact_details || '';
                    leadContactIdHolder.value = selectedContact.lead_contact_id;
                    matchFound = true;
                }
                break;
            }
        }
        if (!matchFound) {
            contactInput.value = '';
            leadContactIdHolder.value = '';
        }
    });
    document.getElementById('visit-status').addEventListener('change', (e) => {
        document.getElementById('visits-completed').style.display = (e.target.value === 'Completed') ? 'block' : 'none';
    });
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
