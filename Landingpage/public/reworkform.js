document.addEventListener('DOMContentLoaded', function () {
  const roleSelect = document.getElementById('role');
  const managerIdContainer = document.getElementById('managerField');
  const managerIdInput = document.getElementById('manager_id');
  const form = document.getElementById('userForm');

  if (!roleSelect || !managerIdContainer || !form || !managerIdInput) {
    console.error('Critical form elements not found in the DOM for reworkform.js.');
    return;
  }

  function toggleManagerIdVisibility() {
    if (roleSelect.value === 'Employee') {
      managerIdContainer.style.display = 'block';
    } else {
      managerIdContainer.style.display = 'none';
      managerIdInput.value = '';
    }
  }
  toggleManagerIdVisibility();
  roleSelect.addEventListener('change', toggleManagerIdVisibility);

  form.addEventListener('submit', function handleRegistration(event) {
    event.preventDefault();
    const employee_id = document.getElementById('empid').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('psw').value;
    const role = document.getElementById('role').value;
    const manager_id = document.getElementById('manager_id').value || null;
    if (!employee_id || !name || !email || !password || !role) {
        alert('Please fill in all required fields: Employee ID, Name, Email, Password, and Role.');
        return;
    }
    if (role === 'Employee' && !manager_id) {
        alert('Manager ID is required for employees.');
        return;
    }

    fetch('http://localhost:3000/api/auth/register', { // This is a registration endpoint
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
      const responseBody = await response.json().catch(() => ({
         error: "Failed to parse server response.",
         details: `Server responded with status: ${response.status} ${response.statusText} and non-JSON body.`
      }));

      if (!response.ok) {
        console.error('Server error response data (from /api/auth/register):', responseBody);
        alert(`Failed to register user: ${responseBody.messageFromServer || responseBody.error || responseBody.details || response.statusText}`);
        throw new Error(responseBody.messageFromServer || responseBody.error || `Server responded with ${response.status}`);
      }
      return responseBody; 
    })
    .then(data => {
      alert('User registered successfully and logged in!'); 
      console.log('Registration successful (in browser console):', data);
      window.location.href = '/landing';
    })
    .catch(error => {
      console.error('Overall registration error (in browser console):', error.message);
    });
  });
});
