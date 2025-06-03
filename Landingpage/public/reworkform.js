document.addEventListener('DOMContentLoaded', function () {
  const roleSelect = document.getElementById('role');
  const managerIdContainer = document.getElementById('managerField');
  const managerIdInput = document.getElementById('manager_id'); // Get the input field itself
  const form = document.getElementById('userForm');

  if (!roleSelect || !managerIdContainer || !form || !managerIdInput) { // Added managerIdInput to check
    console.error('Critical form elements not found in the DOM.');
    return;
  }

  function toggleManagerIdVisibility() {
    if (roleSelect.value === 'Employee') {
      managerIdContainer.style.display = 'block';
    } else {
      managerIdContainer.style.display = 'none';
      managerIdInput.value = ''; // <<< ---- ADD THIS LINE TO CLEAR THE INPUT
    }
  }

  // Initialize visibility and add event listener
  toggleManagerIdVisibility();
  roleSelect.addEventListener('change', toggleManagerIdVisibility);

  form.addEventListener('submit', function loginUser(event) {
    event.preventDefault();

    const employee_id = document.getElementById('empid').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('psw').value;
    const role = document.getElementById('role').value;
    
    // This line will now correctly get an empty string if role is 'Manager' (due to the fix above),
    // which will then be converted to null by `|| null`.
    const manager_id = document.getElementById('manager_id').value || null;

    // ... rest of your fetch call
    fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employee_id,
        name,
        email,
        password,
        role,
        manager_id
      })
    })
    .then(async response => { 
      if (!response.ok) {
        const errorDataFromServer = await response.json().catch(() => {
          return { error: "Failed to parse error response from server.", status: response.status, statusText: response.statusText };
        });
        console.error('Server error response data (in browser console):', errorDataFromServer);
        alert(`Failed to register user: ${errorDataFromServer.messageFromServer || errorDataFromServer.error || response.statusText}`);
        throw new Error(errorDataFromServer.messageFromServer || `Server responded with ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      alert('User registered successfully!');
      console.log('Registration successful (in browser console):', data);
    })
    .catch(error => {
      console.error('Overall registration error (in browser console):', error.message);
    });
  });
});