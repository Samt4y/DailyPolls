const usernameContainer = document.getElementById('username-container');
const pollContainer = document.getElementById('poll-container');
const usernameInput = document.getElementById('username-input');
const usernameSubmit = document.getElementById('username-submit');
const userInfo = document.getElementById('user-info');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const messageEl = document.getElementById('message');
const countdownEl = document.getElementById('countdown');
const leaderboardBtn = document.getElementById('leaderboard-btn');

let pollData = null;
let userGems = 0;
let hasVoted = false;

// Show username input or poll depending on localStorage
function init() {
  const savedUsername = localStorage.getItem('username');
  if (savedUsername) {
    usernameContainer.style.display = 'none';
    pollContainer.style.display = 'flex';
    loadPoll();
    loadUserData(savedUsername);
  } else {
    usernameContainer.style.display = 'flex';
    pollContainer.style.display = 'none';
  }
}

usernameSubmit.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) {
    messageEl.textContent = 'Please enter a username.';
    return;
  }
  localStorage.setItem('username', username);
  usernameContainer.style.display = 'none';
  pollContainer.style.display = 'flex';
  loadPoll();
  loadUserData(username);
});

async function loadUserData(username) {
  try {
    const res = await fetch('https://dailypollbackend.onrender.com/api/leaderboard');
    const leaderboard = await res.json();
    userGems = (leaderboard[username]?.gems) || 0;
    updateUserInfo(username);
  } catch (e) {
    userGems = 0;
    updateUserInfo(username);
  }
}

function updateUserInfo(username) {
  userInfo.textContent = `User: ${username} | Gems: ${userGems}`;
}

async function loadPoll() {
  try {
    const res = await fetch('https://dailypollbackend.onrender.com/api/poll');
    const data = await res.json();

    if (data.error) {
      questionEl.textContent = 'Error loading poll.';
      return;
    }

    pollData = data;
    hasVoted = false;
    messageEl.textContent = '';
    countdownEl.textContent = '';

    questionEl.textContent = pollData.question;
    optionsEl.innerHTML = '';

    pollData.options.forEach(option => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'option';
      optionDiv.dataset.option = option;

      const percentageBar = document.createElement('div');
      percentageBar.className = 'percentage-bar';

      const percentageText = document.createElement('span');
      percentageText.className = 'percentage-text';
      percentageText.textContent = option;

      optionDiv.appendChild(percentageBar);
      optionDiv.appendChild(percentageText);

      optionDiv.addEventListener('click', () => {
        if (hasVoted) return;
        submitVote(option);
      });

      optionsEl.appendChild(optionDiv);
    });

    startCountdown();
  } catch (e) {
    questionEl.textContent = 'Failed to load poll.';
  }
}

async function submitVote(selectedOption) {
  const username = localStorage.getItem('username');
  if (!username) {
    messageEl.textContent = 'No username found. Refresh and enter your name.';
    return;
  }
  try {
    const res = await fetch('https://dailypollbackend.onrender.com/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, vote: selectedOption }),
    });
    const data = await res.json();

    if (data.error) {
      messageEl.textContent = data.error;
      return;
    }

    hasVoted = true;
    displayResults(data.results);

    if (data.correct) {
      messageEl.textContent = '🎉 Correct! You earned 10 gems.';
      userGems += 10;
      updateUserInfo(username);
    } else {
      messageEl.textContent = '❌ Wrong answer. Better luck next time!';
    }
  } catch (e) {
    messageEl.textContent = 'Error submitting vote.';
  }
}

function displayResults(results) {
  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);

  document.querySelectorAll('.option').forEach(optionEl => {
    const optionText = optionEl.dataset.option;
    const count = results[optionText] || 0;
    const percent = totalVotes ? ((count / totalVotes) * 100).toFixed(1) : 0;

    const bar = optionEl.querySelector('.percentage-bar');
    const text = optionEl.querySelector('.percentage-text');

    bar.style.width = percent + '%';
    text.textContent = `${optionText} — ${percent}%`;

    optionEl.classList.add('disabled');
  });
}

function startCountdown() {
  // Assuming backend returns pollEndTimestamp in ISO format
  if (!pollData.pollEndTimestamp) return;

  function updateCountdown() {
    const now = new Date();
    const end = new Date(pollData.pollEndTimestamp);
    const diffMs = end - now;

    if (diffMs <= 0) {
      countdownEl.textContent = 'Next poll available now!';
      clearInterval(countdownInterval);
      return;
    }

    const hrs = Math.floor(diffMs / 1000 / 60 / 60);
    const mins = Math.floor((diffMs / 1000 / 60) % 60);
    const secs = Math.floor((diffMs / 1000) % 60);

    countdownEl.textContent = `Next poll in: ${hrs}h ${mins}m ${secs}s`;
  }

  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);
}

// Leaderboard button
leaderboardBtn.addEventListener('click', () => {
  window.location.href = 'leaderboard.html';
});

// Run init on load
window.addEventListener('DOMContentLoaded', init);

// --- Console command to clear leaderboard and data ---
// In browser console, run:
// fetch('https://dailypollbackend.onrender.com/api/reset-leaderboard', { method: 'POST' }).then(r => r.json()).then(console.log).catch(console.error);
