const backendURL = 'https://dailypollbackend.onrender.com';

let currentUser = localStorage.getItem('username') || null;

function showUsernameInput() {
  const container = document.getElementById('username-container');
  container.innerHTML = `
    <h2>Enter your username</h2>
    <input type="text" id="username" placeholder="Your name" />
    <button id="start-btn">Start</button>
  `;
  document.getElementById('start-btn').onclick = submitUsername;
}

function submitUsername() {
  const input = document.getElementById('username');
  const name = input.value.trim();
  if (name.length === 0) {
    alert('Please enter a username.');
    return;
  }
  localStorage.setItem('username', name);
  location.reload();
}

async function loadPoll() {
  const res = await fetch(`${backendURL}/api/poll`);
  const data = await res.json();

  document.getElementById('poll-question').innerText = data.question;
  const optionsContainer = document.getElementById('poll-options');
  optionsContainer.innerHTML = '';

  data.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-button';
    btn.textContent = option;
    btn.onclick = () => submitVote(index);
    optionsContainer.appendChild(btn);
  });
}

async function submitVote(choiceIndex) {
  const res = await fetch(`${backendURL}/api/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: localStorage.getItem('username'),
      choice: choiceIndex,
    }),
  });
  const data = await res.json();
  showResults(data);
  updateGems();
}

function showResults(results) {
  const container = document.getElementById('poll-options');
  container.innerHTML = '';

  results.percentages.forEach((percent, index) => {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-bar';
    resultDiv.innerHTML = `
      <div class="label">${results.options[index]}</div>
      <div class="bar" style="width: 0%;">${percent}%</div>
    `;
    container.appendChild(resultDiv);

    // Animate bar width
    setTimeout(() => {
      const bar = resultDiv.querySelector('.bar');
      bar.style.width = percent + '%';
    }, 100);
  });
}

async function updateGems() {
  const res = await fetch(`${backendURL}/api/leaderboard`);
  const data = await res.json();
  const user = data.find(u => u.username === localStorage.getItem('username'));
  if (user) {
    document.getElementById('gem-count').innerText = `Gems: ${user.gems}`;
  } else {
    document.getElementById('gem-count').innerText = `Gems: 0`;
  }
}

window.onload = function () {
  if (!currentUser) {
    showUsernameInput();
  } else {
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    loadPoll();
    updateGems();
  }
};
