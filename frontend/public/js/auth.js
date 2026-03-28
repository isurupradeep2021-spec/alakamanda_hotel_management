const roleSelect = document.getElementById('role');
const loginBtn = document.getElementById('loginBtn');

if (roleSelect) {
  window.roles.forEach((role) => {
    const opt = document.createElement('option');
    opt.value = role;
    opt.textContent = role;
    roleSelect.appendChild(opt);
  });
}

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = roleSelect.value;

    if (!email || !password || !role) {
      alert('Please fill all fields.');
      return;
    }

    localStorage.setItem('token', `demo-token-${Date.now()}`);
    localStorage.setItem('user', JSON.stringify({ email, role }));
    window.location.href = '/dashboard';
  });
}
