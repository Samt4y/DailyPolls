// Elements
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const mainApp = document.getElementById('main-app');
const pollQuestion = document.getElementById('poll-question');
const pollOptions = document.getElementById('poll-options');
const gemsCounter = document.getElementById('gems-counter');
const countdownTimer = document.getElementById('countdown-timer');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardDiv = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const backToPollBtn = document.getElementById('back-to-poll');

let currentUserName = null;
let currentPoll = null;
let pollDurationSeconds = 86400; // 24 hours for example
let pollEndTimestamp = null;
let countdownInterval = null;

// Show username input form on start
usernameForm.style.display = 'block';
mainApp.style.display = 'none';
leaderboardDiv.style.display = 'none';

usernameForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = usernameInput.value.trim();
  if (!name) return alert('Please enter a username.');
  currentUserName = name;
  usernameForm.style.display = 'none';
  mainApp.style.display = 'block';
  loadPoll();
  startCountdown();
  loadGems();
});

// Fetch current poll from backend
function loadPoll() {
  fetch('https://your-backend-url.onrender.com/poll')
    .then(res => res.json())
    .then(poll => {
      currentPoll = poll;
      pollQuestion.textContent = poll.question;
      pollOptions.innerHTML = '';
      Object.entries(poll.votes).forEach(([option, votes]) => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'poll-option-btn';
        btn.onclick = () => submitVote(option);
        pollOptions.appendChild(btn);
      });
      pollEndTimestamp = Date.now() + pollDurationSeconds * 1000;
      clearInterval(countdownInterval);
      startCountdown();
    })
    .catch(console.error);
}

// Submit vote to backend
function submitVote(option) {
  fetch('https://your-backend-url.onrender.com/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: currentUserName, option })
  })
  .then(res => res.json())
  .then(data => {
    showResults(data.votes, option);
    gemsCounter.textContent = `Gems: ${data.gems || 0}`;
  })
  .catch(console.error);
}

// Animate showing vote percentages on options
function showResults(votes, selectedOption) {
  const totalVotes = Object.values(votes).reduce((a,b) => a+b, 0);
  pollOptions.innerHTML = '';

  Object.entries(votes).forEach(([option, count]) => {
    const percent = totalVotes ? (count / totalVotes * 100).toFixed(1) : 0;
    const optionDiv = document.createElement('div');
    optionDiv.className = 'result-option';
    optionDiv.textContent = option;

    const bar = document.createElement('div');
    bar.className = 'result-bar';
    bar.style.width = '0%';
    if (option === selectedOption) {
      bar.style.backgroundColor = '#4CAF50'; // highlight selected option green
    } else {
      bar.style.backgroundColor = '#ccc';
    }
    optionDiv.appendChild(bar);
    pollOptions.appendChild(optionDiv);

    // Animate bar fill
    setTimeout(() => {
      bar.style.width = `${percent}%`;
    }, 100);

    // Percentage text
    const percentText = document.createElement('span');
    percentText.textContent = ` ${percent}%`;
    optionDiv.appendChild(percentText);
  });
}

// Load gems count for user (from backend leaderboard)
function loadGems() {
  fetch('https://your-backend-url.onrender.com/leaderboard')
    .then(res => res.json())
    .then(leaderboard => {
      gemsCounter.textContent = `Gems: ${leaderboard[currentUserName] || 0}`;
    })
    .catch(console.error);
}

// Countdown timer display
function startCountdown() {
  countdownInterval = setInterval(() => {
    let diff = pollEndTimestamp - Date.now();
    if (diff <= 0) {
      clearInterval(countdownInterval);
      countdownTimer.textContent = 'Next poll coming soon!';
      // You could also fetch new poll here automatically
      return;
    }
    let hours = Math.floor(diff / 3600000);
    let minutes = Math.floor((diff % 3600000) / 60000);
    let seconds = Math.floor((diff % 60000) / 1000);
    countdownTimer.textContent = `Next poll in: ${hours}h ${minutes}m ${seconds}s`;
  }, 1000);
}

// Show leaderboard on button click
leaderboardBtn.onclick = () => {
  fetch('https://your-backend-url.onrender.com/leaderboard')
    .then(res => res.json())
    .then(leaderboard => {
      leaderboardList.innerHTML = '';
      if (Object.keys(leaderboard).length === 0) {
        leaderboardList.textContent = 'No players yet.';
      } else {
        Object.entries(leaderboard)
          .sort((a,b) => b[1] - a[1]) // sort by gems desc
          .forEach(([user, gems]) => {
            const li = document.createElement('li');
            li.textContent = `${user}: ${gems} gems`;
            leaderboardList.appendChild(li);
          });
      }
      mainApp.style.display = 'none';
      leaderboardDiv.style.display = 'block';
    });
};

// Back to poll button
backToPollBtn.onclick = () => {
  leaderboardDiv.style.display = 'none';
  mainApp.style.display = 'block';
};

