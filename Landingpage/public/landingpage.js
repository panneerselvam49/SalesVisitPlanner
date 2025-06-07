function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
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

async function fetchAndPopulateCompanyDropdown() {
    const companyDetailsSelect = document.getElementById('companydetails');
    try {
        const response = await fetch('/api/customer');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const customers = await response.json();
        companyDetailsSelect.innerHTML = '<option value="">Select a Customer...</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.customer_id;
            option.dataset.contact = customer.contact || ''; // Store contact info on the option
            option.textContent = customer.Company ? `${customer.Company.company_name} (${customer.customer_id})` : `${customer.customer_name} (${customer.customer_id})`;
            companyDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching customers for dropdown:', error);
    }
}

async function fetchAllVisitsAndRender() {
    try {
        const response = await fetch('/api/visit');
        if (!response.ok) throw new Error(`Failed to fetch visits.`);
        const visits = await response.json();
        visits.forEach(addEventToTimeline);
    } catch (error) {
        console.error('Error loading all visits:', error);
    }
}

function formpopup(cellDate, cellTime) {
    const modal = document.getElementById('visit-modal');
    const visitForm = document.getElementById('visit-form');
    visitForm.reset();
    document.getElementById('visit-id-holder').value = '';
    document.getElementById('save-btn').style.display = 'inline-block';
    document.getElementById('update-btn').style.display = 'none';
    document.getElementById('delete-visit-btn').style.display = 'none';
    document.querySelector('.main-content').classList.add('blur-background');

    const visitDateInput = document.getElementById('visit-date');
    if (cellDate) {
        visitDateInput.value = new Date(cellDate).toISOString().split('T')[0];
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
    
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('update-btn').style.display = 'inline-block';
    document.getElementById('delete-visit-btn').style.display = 'inline-block';

    document.getElementById('visit-id-holder').value = visit.visit_id;
    document.getElementById('employeeid').value = visit.employee_id;
    document.getElementById('endtime').value = formatTimeForDisplay(visit.end_time);
    document.getElementById('visit-location').value = visit.location;
    document.getElementById('purpose').value = visit.purpose;
    document.getElementById('visit-status').value = visit.status;
    document.getElementById('completion-notes').value = visit.notes || '';

    if (visit.Customer) {
        document.getElementById('companydetails').value = visit.Customer.customer_id;
        document.getElementById('leaddetails').value = '';
        
        // Parse and display contact info when editing a visit
        const contactInfo = visit.Customer.contact || '';
        const personNameMatch = contactInfo.match(/Name: (.*?)(,|$)/);
        const contactDetailsMatch = contactInfo.match(/Info: (.*)/);
        document.getElementById('person-name').value = personNameMatch ? personNameMatch[1].trim() : '';
        document.getElementById('contact-details').value = contactDetailsMatch ? contactDetailsMatch[1].trim() : '';
    }
}

function closeform() {
    document.getElementById('visit-modal').style.display = "none";
    document.querySelector('.main-content').classList.remove('blur-background');
}

async function handleVisitFormSubmit(event) {
    event.preventDefault();
    const visitId = document.getElementById('visit-id-holder').value;
    const getFieldValue = (id) => document.getElementById(id)?.value.trim() || null;

    const customerId = getFieldValue('companydetails');
    const leadCompanyName = getFieldValue('leaddetails');

    let visitData = {
        employee_id: getFieldValue('employeeid'),
        date: getFieldValue('visit-date'),
        start_time: getFieldValue('starttime'),
        end_time: getFieldValue('endtime'),
        location: getFieldValue('visit-location'),
        purpose: getFieldValue('purpose'),
        status: document.getElementById('visit-status').value,
        notes: getFieldValue('completion-notes'),
        person_name: getFieldValue('person-name'),
        contact_details: getFieldValue('contact-details')
    };

    if (customerId) {
        visitData.customer_id = customerId;
    } else if (leadCompanyName) {
        visitData.lead_company_name = leadCompanyName;
    } else {
        alert('Please select either an Existing Customer or a Lead.');
        return;
    }

    const method = visitId ? 'PUT' : 'POST';
    const url = visitId ? `/api/visit/${visitId}` : '/api/visit';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(visitData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
        window.location.reload();
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
        window.location.reload();
    } catch (error) {
        console.error('Error deleting visit:', error);
        alert(error.message);
    }
}

function addEventToTimeline(visit) {
    if (!visit || !visit.date || !visit.start_time) return;
    const visitDate = new Date(`${visit.date}T00:00:00`);
    const dayOfWeek = visitDate.getDay(); 
    const startTimeHour = parseInt(formatTimeForDisplay(visit.start_time).split(':')[0]);
    const dayColumn = dayOfWeek + 1;
    const targetCell = document.querySelector(`.time-grid > div:nth-child(${startTimeHour * 8 + dayColumn + 1})`);

    if (!targetCell) {
        return;
    }
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event', visit.status.replace(/\s+/g, '-').toLowerCase());
    eventDiv.setAttribute('data-visit-id', visit.visit_id);
    eventDiv.textContent = `${visit.Customer?.customer_name || 'Lead'} @ ${formatTimeForDisplay(visit.start_time)}`;
    targetCell.appendChild(eventDiv);
}

document.addEventListener('DOMContentLoaded', function() {

function initializeGridCellListeners() {
    document.querySelectorAll('.time-grid .grid-cell').forEach((cell, index) => {
        cell.addEventListener('click', function(e) {
            if (e.target.closest('.event')) return;

            const dayIndex = index % 8;
            if (dayIndex === 0) return;

            const hourIndex = Math.floor(index / 8);

            const dayHeader = document.querySelector(`.day-headers .day-header-cell:nth-child(${dayIndex + 1}) .day-number`);
            
            const monthYearText = document.querySelector('.date-range').textContent;
            
            if (dayHeader) {
                const dayNumber = dayHeader.textContent;
                const dateForPopup = new Date(`${monthYearText} ${dayNumber}`);
                const timeForPopup = `${String(hourIndex).padStart(2, '0')}:00`;
                
                formpopup(dateForPopup, timeForPopup);
            }
        });
    });
}
    
    const monthYearEl = document.getElementById("month-year");
    const calendarGridEl = document.querySelector(".calendar .calendar-grid");
    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");
    
     if (monthYearEl && calendarGridEl && prevBtn && nextBtn) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let currentDate = new Date();
        function renderSmallCalendar(month, year) {
            calendarGridEl.innerHTML = ""; 
            const monthName = monthNames[month];
            monthYearEl.textContent = `${monthName} ${year}`;
            document.querySelector('.date-range').textContent = `${monthName} ${year}`;
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            daysOfWeek.forEach(day => {
                const dayHeader = document.createElement("div");
                dayHeader.textContent = day;
                dayHeader.style.fontWeight = 'bold';
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
                const today = new Date();
                if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    dayCell.classList.add("today");
                }
                calendarGridEl.appendChild(dayCell);
            }
        }
        prevBtn.addEventListener("click", () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderSmallCalendar(currentDate.getMonth(), currentDate.getFullYear());
        });
        nextBtn.addEventListener("click", () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderSmallCalendar(currentDate.getMonth(), currentDate.getFullYear());
        });
        renderSmallCalendar(currentDate.getMonth(), currentDate.getFullYear());
    }

    fetchLeadDetails();
    fetchAndPopulateCompanyDropdown();
    fetchAllVisitsAndRender();
    initializeGridCellListeners();

    const visitForm = document.getElementById('visit-form');
    visitForm.addEventListener('submit', handleVisitFormSubmit);
    document.getElementById('update-btn').addEventListener('click', handleVisitFormSubmit);
    document.getElementById('delete-visit-btn').addEventListener('click', handleDeleteVisit);

    document.querySelector('.time-grid').addEventListener('click', async function(e) {
        const eventElement = e.target.closest('.event:not(.multiple-visits)');
        if (eventElement) {
            const visitId = eventElement.getAttribute('data-visit-id');
            if (visitId) {
                try {
                    const response = await fetch(`/api/visit/${visitId}`);
                    if (!response.ok) throw new Error('Failed to fetch visit data.');
                    const visitData = await response.json();
                    populateAndShowVisitForm(visitData);
                } catch (error) {
                    alert('Could not load visit details.');
                }
            }
        }
    });
    
    document.getElementById('visit-modal').addEventListener('click', function(e) {
        if (e.target === this) closeform();
    });

    const customerDropdown = document.getElementById('companydetails');
    const leadDropdown = document.getElementById('leaddetails');
    const personNameInput = document.getElementById('person-name');
    const contactDetailsInput = document.getElementById('contact-details');

    customerDropdown.addEventListener('change', (e) => {
        if (e.target.value) {
            leadDropdown.value = '';
            const selectedOption = e.target.options[e.target.selectedIndex];
            const contactInfo = selectedOption.dataset.contact || '';
            const personNameMatch = contactInfo.match(/Name: (.*?)(,|$)/);
            const contactDetailsMatch = contactInfo.match(/Info: (.*)/);
            personNameInput.value = personNameMatch ? personNameMatch[1].trim() : '';
            contactDetailsInput.value = contactDetailsMatch ? contactDetailsMatch[1].trim() : '';
        }
    });

    leadDropdown.addEventListener('change', () => {
        if (leadDropdown.value) {
            customerDropdown.value = '';
            personNameInput.value = '';
            contactDetailsInput.value = '';
        }
    });
});