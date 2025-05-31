document.addEventListener('DOMContentLoaded', function() {
    const roleSelect = document.getElementById('role');
    const managerIdContainer = document.querySelector('.input-container-manager');
    function toggleManagerIdVisibility() {
        if (roleSelect.value === 'Employee') { 
            managerIdContainer.style.display = 'block'; 
        } else {
            managerIdContainer.style.display = 'none'; 
        }
    }
    toggleManagerIdVisibility();
    roleSelect.addEventListener('change', toggleManagerIdVisibility);
    const form = document.getElementById('userForm');
    form.addEventListener('submit', loginUser);
});

function loginUser(event) {
  event.preventDefault(); // Prevent page reload

  const employee_id = document.getElementById('empid').value;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('psw').value;
  const role = document.getElementById('role').value;
  const manager_id = document.getElementById('manager-id').value || null;

  fetch('http://localhost:3000/api/register', {
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
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to register user.');
    }
    return response.json();
  })
  .then(data => {
    alert('User registered successfully!');
    console.log(data);
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Failed to register user.');
  });
}
