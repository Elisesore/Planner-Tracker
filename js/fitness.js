// State Management
let fitnessData = {
    weight: {
        current: 70,
        goal: 50,
        history: [
            { date: '2024-12-01', weight: 75 },
            { date: '2024-12-08', weight: 72 },
            { date: '2024-12-15', weight: 70 }
        ]
    },
    steps: {
        today: 4000,
        goal: 10000,
        history: {
            'mon': 8500,
            'tue': 10200,
            'wed': 4000,
            'thu': 0,
            'fri': 0,
            'sat': 0,
            'sun': 0
        }
    },
    water: {
        today: 1.5,
        goal: 2.0,
        history: {
            'mon': 2.0,
            'tue': 1.8,
            'wed': 1.5,
            'thu': 0,
            'fri': 0,
            'sat': 0,
            'sun': 0
        }
    },
    workouts: {
        yoga: {
            name: 'yoga',
            weeklyTarget: 7,
            completed: 7,
            types: ['Morning Flow', 'Evening Stretch'],
            doneToday: {
                'mon': true,
                'tue': true,
                'wed': true,
                'thu': false,
                'fri': false,
                'sat': false,
                'sun': false
            }
        },
        pilates: {
            name: 'pilates',
            weeklyTarget: 4,
            completed: 2,
            types: ['Core', 'Full Body'],
            doneToday: {
                'mon': true,
                'tue': true,
                'wed': false,
                'thu': false,
                'fri': false,
                'sat': false,
                'sun': false
            }
        },
        workout: {
            name: 'workout',
            weeklyTarget: 3,
            completed: 1,
            types: ['Back', 'Legs', 'Arms'],
            doneToday: {
                'mon': true,
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

let currentWeekOffset = 0; // 0 = this week, -1 = last week, 1 = next week
const currentDay = 'wed'; // This should be dynamic based on actual day

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    updateWeightDisplay();
    updateStepsDisplay();
    updateWaterDisplay();
    updateWorkoutDisplay();
    updateWeekIndicators();
    setupEventListeners();
});

// Storage Functions
function saveToStorage() {
    localStorage.setItem('fitnessData', JSON.stringify(fitnessData));
}

function loadFromStorage() {
    const stored = localStorage.getItem('fitnessData');
    if (stored) {
        fitnessData = JSON.parse(stored);
    }
}

// Weight Functions
function updateWeightDisplay() {
    const current = fitnessData.weight.current;
    const goal = fitnessData.weight.goal;
    const progress = Math.max(0, ((goal / current) * 100));
    
    document.querySelector('.percentage-text').textContent = Math.round(progress) + '%';
    document.querySelector('.current-weight').textContent = current + 'kg';
    document.querySelector('.goal-weight').textContent = goal + 'kg';
    
    // Update circle progress
    const circle = document.getElementById('weightProgress');
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100 * circumference);
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
}

function saveWeight() {
    const current = parseFloat(document.getElementById('currentWeight').value);
    const goal = parseFloat(document.getElementById('goalWeight').value);
    
    if (current && current > 0) {
        fitnessData.weight.current = current;
        fitnessData.weight.history.push({
            date: new Date().toISOString().split('T')[0],
            weight: current
        });
    }
    
    if (goal && goal > 0) {
        fitnessData.weight.goal = goal;
    }
    
    saveToStorage();
    updateWeightDisplay();
}

// Steps Functions
function updateStepsDisplay() {
    const steps = fitnessData.steps.history[currentDay] || 0;
    const goal = fitnessData.steps.goal;
    
    document.querySelector('#stepsCard .stat-value').textContent = steps;
    document.querySelector('#stepsCard .stat-goal').textContent = goal;
}

function saveSteps() {
    const steps = parseInt(document.getElementById('stepsInput').value);
    
    if (steps && steps >= 0) {
        fitnessData.steps.history[currentDay] = steps;
        saveToStorage();
        updateStepsDisplay();
        updateWeekIndicators();
    }
}

// Water Functions
function updateWaterDisplay() {
    const water = fitnessData.water.history[currentDay] || 0;
    const goal = fitnessData.water.goal;
    
    document.querySelector('#waterCard .stat-value').textContent = water + 'L';
    document.querySelector('#waterCard .stat-goal').textContent = goal + 'L';
}

function saveWater() {
    const water = parseFloat(document.getElementById('waterInput').value);
    
    if (water && water >= 0) {
        fitnessData.water.history[currentDay] = water;
        saveToStorage();
        updateWaterDisplay();
        updateWeekIndicators();
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
    
    // Re-attach click listeners
    document.querySelectorAll('.workout-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            expandWorkout(item.dataset.workout);
        });
    });
}

function expandWorkout(workoutKey) {
    const workout = fitnessData.workouts[workoutKey];
    const workoutEdit = document.getElementById('workoutEdit');
    const isDone = workout.doneToday[currentDay];
    
    workoutEdit.innerHTML = `
        <div class="workout-edit-item">
            <div class="workout-edit-header">
                <input type="text" class="workout-edit-name" value="${workout.name}" 
                       onchange="updateWorkoutName('${workoutKey}', this.value)">
            </div>
            
            <div class="workout-edit-content">
                <div class="weekly-target">
                    <label>Weekly Target:</label>
                    <input type="number" value="${workout.weeklyTarget}" min="1" max="7"
                           onchange="updateWeeklyTarget('${workoutKey}', this.value)">
                    <span>days/week</span>
                </div>
                
                <div>
                    <label style="font-size: 13px; color: #6b7280; display: block; margin-bottom: 8px;">Workout Types:</label>
                    <div class="workout-types">
                        ${workout.types.map(type => `
                            <span class="workout-type-tag">${type}</span>
                        `).join('')}
                    </div>
                    
                    <div class="add-type-input">
                        <input type="text" placeholder="Add type (e.g., Back, Legs)" id="newType${workoutKey}">
                        <button class="add-type-btn" onclick="addWorkoutType('${workoutKey}')">Add</button>
                    </div>
                </div>
                
                <button class="mark-done-btn ${isDone ? 'done' : ''}" 
                        onclick="toggleWorkoutDone('${workoutKey}')">
                    ${isDone ? '✓ Done Today' : 'Mark as Done Today'}
                </button>
            </div>
        </div>
    `;
    
    // Show expanded section
    document.getElementById('workoutExpanded').style.display = 'block';
    document.getElementById('workoutCard').classList.add('expanded');
}

function updateWorkoutName(workoutKey, newName) {
    fitnessData.workouts[workoutKey].name = newName;
    saveToStorage();
    updateWorkoutDisplay();
    expandWorkout(workoutKey); // Re-expand to show updated name
}

function updateWeeklyTarget(workoutKey, target) {
    fitnessData.workouts[workoutKey].weeklyTarget = parseInt(target);
    saveToStorage();
    updateWorkoutDisplay();
    expandWorkout(workoutKey);
}

function addWorkoutType(workoutKey) {
    const input = document.getElementById(`newType${workoutKey}`);
    const type = input.value.trim();
    
    if (type) {
        fitnessData.workouts[workoutKey].types.push(type);
        saveToStorage();
        expandWorkout(workoutKey);
        input.value = '';
    }
}

function toggleWorkoutDone(workoutKey) {
    const workout = fitnessData.workouts[workoutKey];
    const currentStatus = workout.doneToday[currentDay];
    
    workout.doneToday[currentDay] = !currentStatus;
    
    // Update completed count
    workout.completed = Object.values(workout.doneToday).filter(Boolean).length;
    
    saveToStorage();
    updateWorkoutDisplay();
    updateWeekIndicators();
    expandWorkout(workoutKey);
}

// Week Indicators
function updateWeekIndicators() {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    days.forEach(day => {
        const dayItem = document.querySelector(`.day-item[data-day="${day}"]`);
        const indicators = dayItem.querySelector('.day-indicators');
        indicators.innerHTML = '';
        
        // Steps indicator
        if (fitnessData.steps.history[day] >= fitnessData.steps.goal) {
            const bar = document.createElement('div');
            bar.className = 'indicator-bar steps';
            indicators.appendChild(bar);
        }
        
        // Water indicator
        if (fitnessData.water.history[day] >= fitnessData.water.goal) {
            const bar = document.createElement('div');
            bar.className = 'indicator-bar water';
            indicators.appendChild(bar);
        }
        
        // Workout indicators
        Object.entries(fitnessData.workouts).forEach(([key, workout]) => {
            if (workout.doneToday[day]) {
                const bar = document.createElement('div');
                bar.className = `indicator-bar ${key}`;
                indicators.appendChild(bar);
            }
        });
    });
}

// Event Listeners
function setupEventListeners() {
    // Weight card toggle
    document.getElementById('weightCard').addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
            toggleExpand('weightExpanded', this);
        }
    });
    
    // Steps and Water cards - expand combined section
    document.getElementById('stepsCard').addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
            toggleStatsExpanded();
        }
    });
    
    document.getElementById('waterCard').addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
            toggleStatsExpanded();
        }
    });
    
    // Workout card toggle
    document.getElementById('workoutCard').addEventListener('click', function(e) {
        if (!e.target.closest('.workout-item') && 
            e.target.tagName !== 'INPUT' && 
            e.target.tagName !== 'BUTTON') {
            toggleExpand('workoutExpanded', this);
        }
    });
}

function toggleExpand(expandedId, card) {
    const expanded = document.getElementById(expandedId);
    const isVisible = expanded.style.display !== 'none';
    
    expanded.style.display = isVisible ? 'none' : 'block';
    
    if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
    } else {
        card.classList.add('expanded');
    }
}

function toggleStatsExpanded() {
    const statsCard = document.getElementById('statsExpandedCard');
    const isVisible = statsCard.style.display !== 'none';
    
    statsCard.style.display = isVisible ? 'none' : 'block';
}

// Helper Functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
