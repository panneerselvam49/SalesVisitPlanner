// Helper functions (can be at the top)
function getUserRole() {
    const storedRole = sessionStorage.getItem('userRole');
    return storedRole || currentUserRole; // Ensure currentUserRole is defined if sessionStorage is empty
}

function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Returns "HH:MM"
}

function parseDate(dateString) {
    const date = new Date(dateString);
    return {
        year: date.getFullYear(),
        month: date.getMonth(), // 0-indexed
        day: date.getDate()
    };
}

async function fetchAndPopulateCompanyDropdown() {
    const companyDetailsSelect = document.getElementById('companydetails');
    if (!companyDetailsSelect) {
        console.error("Company details dropdown not found!");
        return;
    }

    try {
        const response = await fetch('/api/company');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const companies = await response.json();
        companyDetailsSelect.innerHTML = ''; 

        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "Select a Company";
        companyDetailsSelect.appendChild(placeholderOption);

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.companyid;
            option.textContent = company.company_name;
            companyDetailsSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching or populating company dropdown:', error);
        companyDetailsSelect.innerHTML = '<option value="">Error loading companies</option>';
    }
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
    // const visitTimeInput = document.getElementById('visit-time'); // ID 'visit-time' is not in your HTML, form has 'starttime'
    const visitStartTimeInput = document.getElementById('starttime');


    if (cellDate && visitDateInput) {
        // Convert "Month Day, Year" or "Month Year Day" to "YYYY-MM-DD" for date input
        try {
            const parsedDate = new Date(cellDate);
            const year = parsedDate.getFullYear();
            const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
            const day = parsedDate.getDate().toString().padStart(2, '0');
            visitDateInput.value = `${year}-${month}-${day}`;
        } catch (e) {
            console.error("Error parsing cellDate for form popup:", cellDate, e);
            visitDateInput.value = cellDate; // Fallback
        }
    }
    if (cellTime && visitStartTimeInput) {
        try {
            let [time, modifier] = cellTime.split(' ');
            let [hours, minutes] = time.split(':');
            if (!minutes) minutes = '00'; // Default to :00 if not specified

            hours = parseInt(hours);

            if (modifier && modifier.toUpperCase() === 'PM' && hours < 12) {
                hours += 12;
            }
            if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) { // Midnight case
                hours = 0;
            }
            
            visitStartTimeInput.value = `${hours.toString().padStart(2, '0')}:${minutes}`;
        } catch(e) {
            console.error("Error parsing cellTime for form popup:", cellTime, e);
            visitStartTimeInput.value = cellTime; // Fallback
        }
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
        document.getElementById('companydetails').value = ""; // Reset company dropdown

        const statusSelect = document.getElementById('visit-status');
        if (statusSelect) statusSelect.value = 'Planned';

        const visitCompletedInput = document.getElementById('visits-completed');
        if (visitCompletedInput) {
            visitCompletedInput.style.display = 'none';
        }
    } else {
        console.error('In closeModal: Element with ID "visit-form" not found.');
    }
}

function initializeCalendarDayListeners(monthYearElRef, renderCalendarFunc) {
    const calendarGridEl = document.querySelector(".calendar .calendar-grid");
    const oldDays = calendarGridEl.querySelectorAll('.day');
    oldDays.forEach(day => {
    });

    const calendarDays = calendarGridEl.querySelectorAll('.day'); // Re-query after potential render
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            const dayNumber = this.textContent;
            const monthYearText = monthYearElRef.textContent; // Use the reference
            const visitDateForForm = `${monthYearText} ${dayNumber}`;
            formpopup(visitDateForForm, "09:00"); // Use HH:mm format
        });
    });
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
            if (columnIndex <= 0 || columnIndex >= dayHeaderCells.length) { // Adjusted condition
                console.error('Error in initializeGridCellListeners: columnIndex invalid.');
                return;
            }
            const dayHeader = dayHeaderCells[columnIndex]; // dayHeaderCells is 1-indexed effectively due to the first empty cell in markup
            const dayNumberElement = dayHeader.querySelector('.day-number');
            if (!dayNumberElement) {
                console.error('Error: .day-number element not found.');
                return;
            }
            const dayNumber = dayNumberElement.textContent.trim();
            const dateRangeTextElement = document.querySelector('.date-range');
            if (!dateRangeTextElement) {
                console.error("Could not find '.date-range' element.");
                return;
            }
            const dateRangeText = dateRangeTextElement.textContent;
            const monthMatch = dateRangeText.match(/([A-Za-z]+)\s\d+\s*(-|,)/);
            const yearMatch = dateRangeText.match(/,\s*(\d{4})/);
            const month = monthMatch ? monthMatch[1] : "April"; // Fallback, consider making this more robust
            const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString(); // Fallback

            const visitDate = `${month} ${dayNumber}, ${year}`;
            const rowIndex = Math.floor(index / 8);
            const timeLabels = document.querySelectorAll('.time-label');
            if (rowIndex < 0 || rowIndex >= timeLabels.length) {
                console.error('Error: rowIndex out of bounds for timeLabels.');
                return;
            }
            const timeLabel = timeLabels[rowIndex].textContent.trim();
            formpopup(visitDate, timeLabel);
        });
    });
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
    const statusValue = document.getElementById('visit-status').value;

    const visitData = {
        customer_id: getFieldValue('customerid'),
        employee_id: getFieldValue('employeeid'),
        date: getFieldValue('visit-date'),
        start_time: getFieldValue('starttime'),
        end_time: getFieldValue('endtime'),
        company_id: getFieldValue('companydetails'), // Corrected: get value from company dropdown
        purpose: getFieldValue('purpose'),
        notes: statusValue === 'Completed' ? getFieldValue('completion-notes') : '',
        status: statusValue
    };

    // Adjusted the validation to check for company_id instead of location
    if (!visitData.employee_id || !visitData.customer_id || !visitData.date || !visitData.start_time || !visitData.end_time || !visitData.company_id) {
        alert('Please fill in all required visit details: Employee ID, Customer ID, Date, Start Time, End Time, and Company.');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
    }

    console.log('Submitting Visit Data:', visitData);

    try {
        const response = await fetch('/api/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(visitData),
        });
        if (!response.ok) {
            const errorDataFromServer = await response.json().catch(() => ({
                error: "Failed to parse error response from server",
                details: "Server returned an error status without a JSON body or with malformed JSON."
            }));
            console.error('Server error response data (from /api/visit):', errorDataFromServer);
            let detailedMessage = errorDataFromServer.details || errorDataFromServer.error || `Server responded with ${response.status}`;
            alert(`Failed to save visit: ${detailedMessage}`);
            throw new Error(detailedMessage);
        }
        const newDetailedVisit = await response.json();
        console.log('Visit saved successfully, response:', newDetailedVisit);
        if (typeof addEventToTimeline === 'function') addEventToTimeline(newDetailedVisit);
        if (typeof closeModal === 'function') closeModal();
    } catch (error) {
        console.error('Overall error submitting visit form:', error.message);
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
    const visitDateParts = parseDate(detailedVisit.date);
    const visitStartTime = formatTimeForDisplay(detailedVisit.start_time);
    const visitStatus = detailedVisit.status.toLowerCase();

    const dayHeaders = document.querySelectorAll('.day-headers .day-header-cell');
    const timeLabels = document.querySelectorAll('.time-grid .time-label');
    const timeGrid = document.querySelector('.time-grid');
    const dateRangeTextEl = document.querySelector('.week-header .date-range');
     if (!dateRangeTextEl) {
        console.error("Date range element not found for timeline update.");
        return;
    }
    const dateRangeText = dateRangeTextEl.textContent;


    let targetDayColumnIndex = -1;
    const yearMatch = dateRangeText.match(/(\d{4})/);
    const monthMatch = dateRangeText.match(/([A-Za-z]+)/);

    if (!yearMatch || !monthMatch) {
        console.error("Could not parse year or month from date range text for timeline.");
        return;
    }
    const currentYearInView = parseInt(yearMatch[0]);
    const currentMonthNameInView = monthMatch[0];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthInView = monthNames.findIndex(m => m.toLowerCase() === currentMonthNameInView.toLowerCase());

    if (visitDateParts.year !== currentYearInView || visitDateParts.month !== currentMonthInView) {
        console.warn("Visit date is not in the currently displayed week's month/year. Event not added.");
        return;
    }

    dayHeaders.forEach((header, index) => {
        if (index === 0) return; // First header cell is empty spacer for time labels
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
        const labelTime = label.textContent.trim().toUpperCase();
        const visitHour = parseInt(visitStartTime.split(':')[0]);
        let labelHour;
        if (labelTime.includes("AM")) {
            labelHour = parseInt(labelTime.replace(" AM", ""));
            if (labelHour === 12) labelHour = 0; // 12 AM is hour 0
        } else if (labelTime.includes("PM")) {
            labelHour = parseInt(labelTime.replace(" PM", ""));
            if (labelHour !== 12) labelHour += 12; 
        } else { 
            labelHour = parseInt(labelTime.split(':')[0]);
        }
        if (visitHour === labelHour) {
            targetRowIndex = index;
        }
    });

    if (targetRowIndex === -1) {
        console.warn("Visit start time slot not found in current week view. Event not added.", visitStartTime);
        return;
    }
    const targetCellIndex = targetRowIndex * 8 + targetDayColumnIndex; // 8 columns: 1 for time, 7 for days
    const targetCell = timeGrid.children[targetCellIndex];

    if (!targetCell || !targetCell.classList.contains('grid-cell')) {
        console.error("Calculated target cell is not a valid grid-cell:", targetCell, "at index", targetCellIndex);
        return;
    }
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event', visitStatus.replace(/\s+/g, '-').toLowerCase()); // Ensure status is CSS-friendly
    const employeeName = detailedVisit.Employee ? detailedVisit.Employee.name : 'N/A';
    const customerName = detailedVisit.Customer ? detailedVisit.Customer.customer_name : 'N/A';
    eventDiv.textContent = `Emp ${employeeName} - ${customerName} (${visitStartTime})`;
    eventDiv.setAttribute('data-visit-id', detailedVisit.visit_id || 'N/A');
    targetCell.appendChild(eventDiv);
    console.log(`Event added to: Day Column Index ${targetDayColumnIndex}, Row Index ${targetRowIndex}`);
}
$(document).ready(function() {
    // Initialize form submit listener
    const visitForm = document.getElementById('visit-form');
    if (visitForm) {
        visitForm.addEventListener('submit', handleVisitFormSubmit);
    } else {
        console.error("Visit form with ID 'visit-form' not found for submit listener.");
    }
    fetchAndPopulateCompanyDropdown();

    initializeGridCellListeners(); 
    const monthYearEl = document.getElementById("month-year");
    const calendarGridEl = document.querySelector(".calendar .calendar-grid");
    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");

    if (monthYearEl && calendarGridEl && prevBtn && nextBtn) {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let calCurrentDate = new Date(); // Use a different name to avoid conflict if 'currentDate' is used elsewhere
        let calCurrentMonth = calCurrentDate.getMonth();
        let calCurrentYear = calCurrentDate.getFullYear();

        function renderSmallCalendar(month, year) {
            if (!calendarGridEl) return;
            calendarGridEl.innerHTML = ""; // Clear previous grid

            daysOfWeek.forEach(day => {
                const dayHeader = document.createElement("div");
                dayHeader.textContent = day;
                calendarGridEl.appendChild(dayHeader);
            });

            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

            for (let i = 0; i < firstDayOfMonth; i++) {
                calendarGridEl.appendChild(document.createElement("div")); // Empty cells for offset
            }

            for (let day = 1; day <= daysInCurrentMonth; day++) {
                const dayCell = document.createElement("div");
                dayCell.classList.add("day");
                dayCell.textContent = day;

                if (day === calCurrentDate.getDate() && month === calCurrentDate.getMonth() && year === calCurrentDate.getFullYear()) {
                    dayCell.classList.add("today");
                }
                dayCell.addEventListener('click', function() {
                    const dayNumberText = this.textContent;
                    const monthYearText = monthYearEl.textContent;
                    const visitDateForForm = `${monthYearText} ${dayNumberText}`;
                    formpopup(visitDateForForm, "09:00"); // Default time, HH:mm
                });
                calendarGridEl.appendChild(dayCell);
            }
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthYearEl.textContent = `${monthNames[month]} ${year}`;
        }

        prevBtn.addEventListener("click", () => {
            calCurrentMonth--;
            if (calCurrentMonth < 0) {
                calCurrentMonth = 11;
                calCurrentYear--;
            }
            renderSmallCalendar(calCurrentMonth, calCurrentYear);
        });

        nextBtn.addEventListener("click", () => {
            calCurrentMonth++;
            if (calCurrentMonth > 11) {
                calCurrentMonth = 0;
                calCurrentYear++;
            }
            renderSmallCalendar(calCurrentMonth, calCurrentYear);
        });

        renderSmallCalendar(calCurrentMonth, calCurrentYear); // Initial render
    } else {
        console.warn("One or more small calendar elements (month-year, calendar-grid, prev-month, next-month) not found.");
    }
    const visitStatusSelect = document.getElementById('visit-status');
    const visitCompletedInput = document.getElementById('visits-completed');
    if (visitStatusSelect && visitCompletedInput) {
        visitStatusSelect.addEventListener('change', function() {
            visitCompletedInput.style.display = (this.value === 'Completed') ? 'block' : 'none';
        });
    }
    document.querySelectorAll('.day-headers .day-header-cell .day-name').forEach((el) => {
        if (el.textContent.trim() === 'Sun') {
            el.closest('.day-header-cell').classList.add('sunday-header');
        }
    });
});
