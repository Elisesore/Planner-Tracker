// State Management
let fitnessData = {
   weight: {
       current: 0,
       goal: 0,
       history: []
   },
   steps: {
       today: 0,
       goal: 10000,
       history: {
           'mon': 0,
           'tue': 0,
           'wed': 0,
           'thu': 0,
           'fri': 0,
           'sat': 0,
           'sun': 0
       }
   },
   water: {
       today: 0,
       goal: 2.0,
       history: {
           'mon': 0,
           'tue': 0,
           'wed': 0,
           'thu': 0,
           'fri': 0,
           'sat': 0,
           'sun': 0
       }
   },
   workouts: {
       yoga: {
           name: 'Yoga',
           weeklyTarget: 7,
           completed: 0,
           types: ['Morning Flow', 'Evening Stretch'],
           doneToday: {
               'mon': false,
               'tue': false,
               'wed': false,
               'thu': false,
               'fri': false,
               'sat': false,
               'sun': false
           }
       },
       pilates: {
           name: 'Pilates',
           weeklyTarget: 4,
           completed: 0,
           types: ['Core', 'Full Body'],
           doneToday: {
               'mon': false,
               'tue': false,
               'wed': false,
               'thu': false,
               'fri': false,
               'sat': false,
               'sun': false
           }
       },
       workout: {
           name: 'Workout',
           weeklyTarget: 3,
           completed: 0,
           types: ['Back', 'Legs', 'Arms'],
           doneToday: {
               'mon': false,
               'tue': false,
               'wed': false,
               'thu': false,
               'fri': false,
               'sat': false,
               'sun': false
           }
       }
   }
};

let currentDay = 'wed';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
   // Set current day dynamically
   const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
   const today = new Date().getDay();
   currentDay = days[today];
   
   // Update active day in UI
   document.querySelectorAll('.day-item').forEach(item => {
       item.classList.remove('active');
   });
   document.querySelector(`.day-item[data-day="${currentDay}"]`)?.classList.add('active');
   
   updateWeightDisplay();
   updateStepsDisplay();
   updateWaterDisplay();
   updateWorkoutDisplay();
   updateWeekIndicators();
   setupEventListeners();
   
   // Add day click handlers
   document.querySelectorAll('.day-item').forEach(item => {
       item.addEventListener('click', function() {
           currentDay = this.dataset.day;
           
           // Update active state
           document.querySelectorAll('.day-item').forEach(d => d.classList.remove('active'));
           this.classList.add('active');
           
           // Update displays
           updateStepsDisplay();
           updateWaterDisplay();
       });
   });
});

// Weight Functions
function updateWeightDisplay() {
    const { starting, current, goal } = fitnessData.weight;

    let progress = 0;

    if (starting > 0 && goal > 0 && starting !== goal) {
        const totalToLose = Math.abs(starting - goal);
        const lostSoFar = Math.abs(starting - current);

        // Prevent going over 100% or under 0%
        progress = Math.min(100, Math.max(0, (lostSoFar / totalToLose) * 100));
    }

    const percentage = Math.round(progress);

    document.querySelector('.percentage-text').textContent = percentage + '%';
    document.querySelector('.current-weight').textContent = current + 'kg';
    document.querySelector('.goal-weight').textContent = goal + 'kg';

    // Optional: show starting weight too
    // document.querySelector('.starting-weight').textContent = starting + 'kg →';

    const circle = document.getElementById('weightProgress');
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100 * circumference);

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
}

function openWeightModal() {
   const modalBody = document.getElementById('modalBody');
   document.getElementById('modalTitle').textContent = '🎯 Goal Weight';
   
   modalBody.innerHTML = `
       <div class="weight-inputs">
           <div class="input-group">
               <label>Current Weight (kg)</label>
               <input type="number" id="currentWeight" placeholder="Enter current weight" value="${fitnessData.weight.current || ''}">
           </div>
           <div class="input-group">
               <label>Goal Weight (kg)</label>
               <input type="number" id="goalWeight" placeholder="Enter goal weight" value="${fitnessData.weight.goal || ''}">
           </div>
           <button class="save-btn" id="saveWeightBtn">Save</button>
       </div>
   `;
   
   document.getElementById('modalOverlay').classList.add('active');
   
   // Add event listener to save button
   document.getElementById('saveWeightBtn').addEventListener('click', saveWeight);
}

function saveWeight() {
    const current = parseFloat(document.getElementById('currentWeight').value);
    const goal = parseFloat(document.getElementById('goalWeight').value);

    if (current && current > 0) {
        // Only set starting weight if it's the first time (or reset)
        if (fitnessData.weight.starting === 0 || fitnessData.weight.starting === fitnessData.weight.current) {
            fitnessData.weight.starting = current;
        }
        fitnessData.weight.current = current;
    }

    if (goal && goal > 0) {
        fitnessData.weight.goal = goal;
    }

    updateWeightDisplay();
    closeModal();
}

// Steps Functions
function updateStepsDisplay() {
   const steps = fitnessData.steps.history[currentDay] || 0;
   const goal = fitnessData.steps.goal;
  
   document.querySelector('#stepsCard .stat-value').textContent = steps;
   document.querySelector('#stepsCard .stat-goal').textContent = '/ ' + goal;
}

function openStepsModal() {
   const modalBody = document.getElementById('modalBody');
   document.getElementById('modalTitle').textContent = '👟 Steps';
   
   const historyHTML = Object.entries(fitnessData.steps.history)
       .map(([day, value]) => `
           <div class="history-item">
               <span>${capitalizeFirst(day)}</span>
               <span>${value}</span>
           </div>
       `).join('');
   
   modalBody.innerHTML = `
       <div class="history-list">
           ${historyHTML}
       </div>
       <div class="input-group">
           <label>Update Steps for ${capitalizeFirst(currentDay)}</label>
           <input type="number" id="stepsInput" placeholder="Enter steps" value="${fitnessData.steps.history[currentDay] || ''}">
           <button class="save-btn" id="saveStepsBtn">Save</button>
       </div>
   `;
   
   document.getElementById('modalOverlay').classList.add('active');
   
   // Add event listener to save button
   document.getElementById('saveStepsBtn').addEventListener('click', saveSteps);
}

function saveSteps() {
   const steps = parseInt(document.getElementById('stepsInput').value);
  
   if (steps >= 0) {
       fitnessData.steps.history[currentDay] = steps;
       updateStepsDisplay();
       updateWeekIndicators();
       closeModal();
   }
}

// Water Functions
function updateWaterDisplay() {
   const water = fitnessData.water.history[currentDay] || 0;
   const goal = fitnessData.water.goal;
  
   document.querySelector('#waterCard .stat-value').textContent = water + 'L';
   document.querySelector('#waterCard .stat-goal').textContent = '/ ' + goal + 'L';
}

function openWaterModal() {
   const modalBody = document.getElementById('modalBody');
   document.getElementById('modalTitle').textContent = '💧 Water';
   
   const historyHTML = Object.entries(fitnessData.water.history)
       .map(([day, value]) => `
           <div class="history-item">
               <span>${capitalizeFirst(day)}</span>
               <span>${value}L</span>
           </div>
       `).join('');
   
   modalBody.innerHTML = `
       <div class="history-list">
           ${historyHTML}
       </div>
       <div class="input-group">
           <label>Update Water for ${capitalizeFirst(currentDay)} (L)</label>
           <input type="number" step="0.1" id="waterInput" placeholder="Enter liters" value="${fitnessData.water.history[currentDay] || ''}">
           <button class="save-btn" id="saveWaterBtn">Save</button>
       </div>
   `;
   
   document.getElementById('modalOverlay').classList.add('active');
   
   // Add event listener to save button
   document.getElementById('saveWaterBtn').addEventListener('click', saveWater);
}

function saveWater() {
   const water = parseFloat(document.getElementById('waterInput').value);
  
   if (water >= 0) {
       fitnessData.water.history[currentDay] = water;
       updateWaterDisplay();
       updateWeekIndicators();
       closeModal();
   }
}

// Workout Functions
function updateWorkoutDisplay() {
   const workoutList = document.querySelector('.workout-list');
  
   workoutList.innerHTML = Object.entries(fitnessData.workouts).map(([key, workout]) => {
       const percentage = (workout.completed / workout.weeklyTarget) * 100;
      
       return `
           <div class="workout-item" data-workout="${key}">
               <div class="workout-info">
                   <span class="workout-name">${workout.name}</span>
                   <span class="workout-progress">${workout.completed}/${workout.weeklyTarget} days</span>
               </div>
               <div class="progress-bar">
                   <div class="progress-fill" style="width: ${percentage}%;"></div>
               </div>
           </div>
       `;
   }).join('');
  
   // Re-attach click listeners to workout items
   document.querySelectorAll('.workout-item').forEach(item => {
       item.addEventListener('click', (e) => {
           e.stopPropagation();
           openWorkoutModal(item.dataset.workout);
       });
   });
}

function openWorkoutModal(workoutKey) {
   const workout = fitnessData.workouts[workoutKey];
   const isDone = workout.doneToday[currentDay];
   const modalBody = document.getElementById('modalBody');
   document.getElementById('modalTitle').textContent = `💪 ${workout.name}`;
  
   modalBody.innerHTML = `
       <div class="workout-edit">
           <div class="workout-edit-item">
               <div class="workout-edit-content">
                   <div class="weekly-target">
                       <label>Weekly Target:</label>
                       <input type="number" value="${workout.weeklyTarget}" min="1" max="7" id="weeklyTarget${workoutKey}">
                       <span>days/week</span>
                   </div>
                  
                   <div class="workout-types">
                       ${workout.types.map(type => `
                           <span class="workout-type-tag">${type}</span>
                       `).join('')}
                   </div>
                  
                   <div class="add-type-input">
                       <input type="text" placeholder="Add type (e.g., Back, Legs)" id="newType${workoutKey}">
                       <button class="add-type-btn" id="addTypeBtn${workoutKey}">Add</button>
                   </div>
                  
                   <button class="mark-done-btn ${isDone ? 'done' : ''}" id="markDoneBtn${workoutKey}">
                       ${isDone ? '✓ Done Today' : 'Mark as Done Today'}
                   </button>
                   
                   <button class="save-btn" id="saveTargetBtn${workoutKey}">Save Target</button>
               </div>
           </div>
       </div>
   `;
   
   document.getElementById('modalOverlay').classList.add('active');
   
   // Add event listeners
   document.getElementById(`saveTargetBtn${workoutKey}`).addEventListener('click', () => saveWorkoutTarget(workoutKey));
   document.getElementById(`addTypeBtn${workoutKey}`).addEventListener('click', () => addWorkoutType(workoutKey));
   document.getElementById(`markDoneBtn${workoutKey}`).addEventListener('click', () => toggleWorkoutDone(workoutKey));
}

function saveWorkoutTarget(workoutKey) {
   const target = parseInt(document.getElementById(`weeklyTarget${workoutKey}`).value);
   if (target >= 1 && target <= 7) {
       fitnessData.workouts[workoutKey].weeklyTarget = target;
       updateWorkoutDisplay();
       closeModal();
   }
}

function addWorkoutType(workoutKey) {
   const input = document.getElementById(`newType${workoutKey}`);
   const type = input.value.trim();
  
   if (type) {
       fitnessData.workouts[workoutKey].types.push(type);
       openWorkoutModal(workoutKey);
   }
}

function toggleWorkoutDone(workoutKey) {
   const workout = fitnessData.workouts[workoutKey];
   const currentStatus = workout.doneToday[currentDay];
  
   workout.doneToday[currentDay] = !currentStatus;
   workout.completed = Object.values(workout.doneToday).filter(Boolean).length;
  
   updateWorkoutDisplay();
   updateWeekIndicators();
   openWorkoutModal(workoutKey);
}

// Week Indicators
function updateWeekIndicators() {
   const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
   days.forEach(day => {
       const dayItem = document.querySelector(`.day-item[data-day="${day}"]`);
       const indicators = dayItem.querySelector('.day-indicators');
       indicators.innerHTML = '';
      
       if (fitnessData.steps.history[day] >= fitnessData.steps.goal) {
           const bar = document.createElement('div');
           bar.className = 'indicator-bar steps';
           indicators.appendChild(bar);
       }
      
       if (fitnessData.water.history[day] >= fitnessData.water.goal) {
           const bar = document.createElement('div');
           bar.className = 'indicator-bar water';
           indicators.appendChild(bar);
       }
      
       Object.entries(fitnessData.workouts).forEach(([key, workout]) => {
           if (workout.doneToday[day]) {
               const bar = document.createElement('div');
               bar.className = `indicator-bar ${key}`;
               indicators.appendChild(bar);
           }
       });
   });
}

// Modal Functions
function closeModal() {
   document.getElementById('modalOverlay').classList.remove('active');
}

// Event Listeners
function setupEventListeners() {
   document.getElementById('weightCard').addEventListener('click', openWeightModal);
   document.getElementById('stepsCard').addEventListener('click', openStepsModal);
   document.getElementById('waterCard').addEventListener('click', openWaterModal);
   
   document.getElementById('closeModalBtn').addEventListener('click', closeModal);
   
   document.getElementById('modalOverlay').addEventListener('click', (e) => {
       if (e.target.id === 'modalOverlay') {
           closeModal();
       }
   });
}

function capitalizeFirst(str) {
   return str.charAt(0).toUpperCase() + str.slice(1);
}
