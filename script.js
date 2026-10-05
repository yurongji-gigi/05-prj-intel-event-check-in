// Settings
const maxCount = 50;
const SHOW_TEST_BUTTON = false;
const storageKey = "intelSummitCheckIn";

// Get existing HTML elements
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const attendeeCount = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");
const greeting = document.getElementById("greeting");

const teamNames = {
  water: "Team Water Wise",
  zero: "Team Net Zero",
  power: "Team Renewables",
};

let attendees = [];
let celebrationRunning = false;

// Restore saved attendees
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));

  if (saved && Array.isArray(saved.attendees)) {
    attendees = saved.attendees.filter(function (attendee) {
      return (
        attendee &&
        typeof attendee.name === "string" &&
        attendee.name.trim() !== "" &&
        Object.hasOwn(teamNames, attendee.team)
      );
    });
  }
} catch (error) {
  console.warn("Could not load saved attendance.", error);
}

// Create the goal celebration message
const celebrationMessage = document.createElement("p");
celebrationMessage.setAttribute("role", "status");

Object.assign(celebrationMessage.style, {
  textAlign: "center",
  fontWeight: "bold",
  color: "#0071c5",
  padding: "0 16px",
});

document.querySelector(".attendance-tracker").appendChild(celebrationMessage);

// Create the attendee list
const listSection = document.createElement("section");
listSection.style.marginTop = "24px";

const listHeading = document.createElement("h3");
listHeading.textContent = "Attendee List";

const attendeeList = document.createElement("ul");

Object.assign(attendeeList.style, {
  listStyle: "none",
  padding: "0",
});

listSection.append(listHeading, attendeeList);
document.querySelector(".team-stats").after(listSection);

greeting.setAttribute("role", "status");

// Full-screen celebration animation
// The test button can force animation for testing.
// Automatic celebrations respect reduced-motion preferences.
function launchCelebration(forceAnimation = false) {
  if (celebrationRunning) {
    return;
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion && !forceAnimation) {
    return;
  }

  celebrationRunning = true;

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");

  Object.assign(layer.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "99999",
  });

  document.body.appendChild(layer);

  const bursts = [
    { x: 50, y: 50, delay: 0 },
    { x: 25, y: 55, delay: 250 },
    { x: 75, y: 55, delay: 500 },
  ];

  const animations = [];

  try {
    bursts.forEach(function (burst) {
      for (let i = 0; i < 45; i++) {
        const particle = document.createElement("span");
        particle.textContent = "🎉";

        Object.assign(particle.style, {
          position: "absolute",
          display: "block",
          left: burst.x + "%",
          top: burst.y + "%",
          fontSize: 22 + Math.random() * 24 + "px",
          lineHeight: "1",
          opacity: "0",
        });

        layer.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const distance =
          Math.max(window.innerWidth, window.innerHeight) *
          (0.2 + Math.random() * 0.5);

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const rotation = Math.random() * 720 - 360;
        const fall = window.innerHeight * 0.6;

        const animation = particle.animate(
          [
            {
              transform: "translate(-50%, -50%) scale(0)",
              opacity: 0,
              offset: 0,
            },
            {
              transform:
                `translate(calc(-50% + ${x * 0.15}px), ` +
                `calc(-50% + ${y * 0.15}px)) scale(1.3)`,
              opacity: 1,
              offset: 0.12,
            },
            {
              transform:
                `translate(calc(-50% + ${x}px), ` +
                `calc(-50% + ${y}px)) ` +
                `rotate(${rotation}deg) scale(1)`,
              opacity: 1,
              offset: 0.55,
            },
            {
              transform:
                `translate(calc(-50% + ${x * 1.1}px), ` +
                `calc(-50% + ${y + fall}px)) ` +
                `rotate(${rotation + 180}deg) scale(0.6)`,
              opacity: 0,
              offset: 1,
            },
          ],
          {
            duration: 2200 + Math.random() * 800,
            delay: burst.delay + Math.random() * 120,
            easing: "ease-out",
            fill: "both",
          },
        );

        animations.push(animation.finished);
      }
    });

    Promise.allSettled(animations).then(function () {
      layer.remove();
      celebrationRunning = false;
    });
  } catch (error) {
    layer.remove();
    celebrationRunning = false;
    console.error("Celebration animation failed.", error);
    greeting.textContent =
      "The celebration animation could not play. Check the browser console.";
  }
}

// Optional button for testing the animation
if (SHOW_TEST_BUTTON) {
  const testButton = document.createElement("button");
  testButton.type = "button";
  testButton.textContent = "Test Celebration 🎉";

  Object.assign(testButton.style, {
    display: "block",
    margin: "16px auto",
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#0071c5",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
  });

  testButton.addEventListener("click", function () {
    launchCelebration(true);
  });

  document.querySelector(".attendance-tracker").appendChild(testButton);
}

// Count attendees for each team
function getTeamCounts() {
  const counts = {
    water: 0,
    zero: 0,
    power: 0,
  };

  attendees.forEach(function (attendee) {
    counts[attendee.team]++;
  });

  return counts;
}

// Update attendance, progress, winners, and attendee list
function updateDisplay() {
  const count = attendees.length;
  const counts = getTeamCounts();

  attendeeCount.textContent = count;

  Object.keys(counts).forEach(function (team) {
    document.getElementById(team + "Count").textContent = counts[team];
  });

  const percentage = Math.min((count / maxCount) * 100, 100);
  progressBar.style.width = percentage + "%";

  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-label", "Attendance goal progress");
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", String(maxCount));
  progressBar.setAttribute("aria-valuenow", String(Math.min(count, maxCount)));

  if (count >= maxCount) {
    const highestCount = Math.max(...Object.values(counts));

    const winners = Object.keys(counts).filter(function (team) {
      return counts[team] === highestCount;
    });

    const winnerNames = winners.map(function (team) {
      return teamNames[team];
    });

    const attendeeWord = highestCount === 1 ? "attendee" : "attendees";

    celebrationMessage.textContent =
      winners.length === 1
        ? `🎉 Goal reached! ${winnerNames[0]} wins with ${highestCount} ${attendeeWord}!`
        : `🎉 Goal reached! It's a tie: ${winnerNames.join(" and ")} with ${highestCount} ${attendeeWord} each!`;
  } else {
    celebrationMessage.textContent = "";
  }

  attendeeList.replaceChildren();

  if (count === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No attendees yet.";
    attendeeList.appendChild(emptyMessage);
  }

  attendees.forEach(function (attendee, index) {
    const item = document.createElement("li");

    item.textContent = `${index + 1}. ${attendee.name} — ${teamNames[attendee.team]}`;

    Object.assign(item.style, {
      padding: "12px 0",
      borderBottom: "1px solid #ddd",
    });

    attendeeList.appendChild(item);
  });
}

// Save attendance to this browser
function saveProgress() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        attendees: attendees,
        totalAttendance: attendees.length,
        teamCounts: getTeamCounts(),
      }),
    );

    return true;
  } catch (error) {
    console.warn("Could not save attendance.", error);
    return false;
  }
}

// Handle a new check-in
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const team = teamSelect.value;

  if (!name || !Object.hasOwn(teamNames, team)) {
    greeting.textContent = "Please enter your name and select a team.";
    return;
  }

  const previousCount = attendees.length;

  attendees.push({
    name: name,
    team: team,
  });

  updateDisplay();
  const saved = saveProgress();

  greeting.textContent = `🎉 Welcome, ${name} from ${teamNames[team]}!`;

  if (!saved) {
    greeting.textContent += " Your check-in could not be saved for next time.";
  }

  form.reset();
  nameInput.focus();

  // Only explode when this check-in crosses the attendance goal
  if (previousCount < maxCount && attendees.length >= maxCount) {
    launchCelebration();
  }
});

// Restore the display without replaying fireworks
updateDisplay();
