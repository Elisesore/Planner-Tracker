// State management
let tasks = {};
let selectedDate = null;
let editingTask = null;
let activeTab = 'planner';
let viewMode = 'week';
let currentWeekStart = new Date();

const colors = ['#b4c6dc', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#e9bdbe'];

// Utility functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
}

function getDateDisplay(date) {
    return date.getDate();
}

function getWeekDates(startDate = new Date()) {
    const date = new Date(startDate);
    const currentDay = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
        const weekDate = new Date(monday);
        weekDate.setDate(monday.getDate() + i);
        week.push(weekDate);
    }
    return week;
}

function getMonthDates() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const dates = [];
    
    for (let i = startDay - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        dates.push({ date, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        dates.push({ date, isCurrentMonth: true });
    }
    
    const remainingDays = 42 - dates.length;
    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        dates.push({ date, isCurrentMonth: false });
    }
    
    return dates;
}

function getDailyTasks() {
    const allTasks = Object.values(tasks).flat();
    const dailyTasksMap = new Map();
    
    allTasks.forEach(task => {
        if (task && task.isDaily && !dailyTasksMap.has(task.id)) {
            dailyTasksMap.set(task.id, task);
        }
    });
    
    return Array.from(dailyTasksMap.values());
}

function getTasksForDate(date) {
    const dateKey = formatDate(date);
    const dateTasks = (tasks[dateKey] || []).filter(task => !task.isDaily);
    const dailyTasks = getDailyTasks();
    const completionKey = `${dateKey}-completions`;
    const completions = tasks[completionKey] || [];
    
    const dailyTasksForDate = dailyTasks.map(task => ({
        ...task,
        id: `daily-${task.id}-${dateKey}`,
        originalId: task.id,
        dateKey: dateKey,
        completed: completions.includes(task.id)
    }));
    
    return [...dateTasks, ...dailyTasksForDate];
}

// Task operations
function addTask(date, isTodoList = false) {
    const dateKey = formatDate(date);
    const newTask = {
        id: Date.now(),
        text: isTodoList ? 'To-Do List' : 'New Task',
        completed: false,
        color: '#3b82f6',
        isDaily: false,
        isTodoList: isTodoList,
        todoItems: isTodoList ? [] : undefined
    };
    
    if (!tasks[dateKey]) {
        tasks[dateKey] = [];
    }
    tasks[dateKey].push(newTask);
    saveToStorage();
    renderWeekView();
}

function addTodoItem(date, taskId, isDaily) {
    const newItem = {
        id: Date.now(),
        text: 'New item',
        completed: false
    };

    if (isDaily) {
        Object.keys(tasks).forEach(key => {
            if (!key.endsWith('-completions') && tasks[key]) {
                tasks[key] = tasks[key].map(task =>
                    task.id === taskId 
                        ? { ...task, todoItems: [...(task.todoItems || []), newItem] }
                        : task
                );
            }
        });
    } else {
        const dateKey = formatDate(date);
        if (tasks[dateKey]) {
            tasks[dateKey] = tasks[dateKey].map(task =>
                task.id === taskId 
                    ? { ...task, todoItems: [...(task.todoItems || []), newItem] }
                    : task
            );
        }
    }
    saveToStorage();
    renderWeekView();
}

function toggleTodoItem(date, taskId, itemId, isDaily) {
    if (isDaily) {
        Object.keys(tasks).forEach(key => {
            if (!key.endsWith('-completions') && tasks[key]) {
                tasks[key] = tasks[key].map(task =>
                    task.id === taskId 
                        ? { 
                            ...task, 
                            todoItems: task.todoItems.map(item =>
                                item.id === itemId ? { ...item, completed: !item.completed } : item
                            )
                        }
                        : task
                );
            }
        });
    } else {
        const dateKey = formatDate(date);
        if (tasks[dateKey]) {
            tasks[dateKey] = tasks[dateKey].map(task =>
                task.id === taskId 
                    ? { 
                        ...task, 
                        todoItems: task.todoItems.map(item =>
                            item.id === itemId ? { ...item, completed: !item.completed } : item
                        )
                    }
                    : task
            );
        }
    }
    saveToStorage();
    renderWeekView();
}

// CRITICAL FIX: Don't call renderWeekView() on text input
function updateTodoItem(date, taskId, itemId, text, isDaily) {
    if (isDaily) {
        Object.keys(tasks).forEach(key => {
            if (!key.endsWith('-completions') && tasks[key]) {
                tasks[key] = tasks[key].map(task =>
                    task.id === taskId 
                        ? { 
                            ...task, 
                            todoItems: task.todoItems.map(item =>
                                item.id === itemId ? { ...item, text } : item
                            )
                        }
                        : task
                );
            }
        });
    } else {
        const dateKey = formatDate(date);
        if (tasks[dateKey]) {
            tasks[dateKey] = tasks[dateKey].map(task =>
                task.id === taskId 
                    ? { 
                        ...task, 
                        todoItems: task.todoItems.map(item =>
                            item.id === itemId ? { ...item, text } : item
                        )
                    }
                    : task
            );
        }
    }
    saveToStorage();
    // DON'T call renderWeekView() here - it destroys the input!
}

function deleteTodoItem(date, taskId, itemId, isDaily) {
    if (isDaily) {
        Object.keys(tasks).forEach(key => {
            if (!key.endsWith('-completions') && tasks[key]) {
                tasks[key] = tasks[key].map(task =>
                    task.id === taskId 
                        ? { ...task, todoItems: task.todoItems.filter(item => item.id !== itemId) }
                        : task
                );
            }
        });
    } else {
        const dateKey = formatDate(date);
        if (tasks[dateKey]) {
            tasks[dateKey] = tasks[dateKey].map(task =>
                task.id === taskId 
                    ? { ...task, todoItems: task.todoItems.filter(item => item.id !== itemId) }
                    : task
            );
        }
    }
    saveToStorage();
    renderWeekView();
}

function toggleTaskComplete(date, taskId, isDaily, dateKey) {
    if (isDaily) {
        const completionKey = `${dateKey}-completions`;
        const completions = tasks[completionKey] || [];
        const isCompleted = completions.includes(taskId);
        
        tasks[completionKey] = isCompleted 
            ? completions.filter(id => id !== taskId)
            : [...completions, taskId];
    } else {
        const dateDateKey = formatDate(date);
        if (tasks[dateDateKey]) {
            tasks[dateDateKey] = tasks[dateDateKey].map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            );
        }
    }
    editingTask = null;
    saveToStorage();
    renderWeekView();
}

// CRITICAL FIX: Don't call renderWeekView() on text input
function updateTask(date, taskId, updates, isDaily) {
    if (isDaily) {
        Object.keys(tasks).forEach(key => {
            if (!key.endsWith('-completions') && tasks[key]) {
                tasks[key] = tasks[key].map(task =>
                    task.id === taskId ? { ...task, ...updates } : task
                );
            }
        });
    } else {
        const dateKey = formatDate(date);
        if (tasks[dateKey]) {
            tasks[dateKey] = tasks[dateKey].map(task =>
                task.id === taskId ? { ...task, ...updates } : task
            );
        }
    }
    saveToStorage();
    
    // ONLY re-render if we're changing something that needs visual update (not text)
    if (!updates.text) {
        renderWeekView();
    }
}

function deleteTask(date, taskId, isDaily) {
    if (isDaily) {
        Object.keys(tasks).forEach(key => {
            if (!key.endsWith('-completions') && tasks[key]) {
                tasks[key] = tasks[key].filter(task => task.id !== taskId);
            }
        });
    } else {
        const dateKey = formatDate(date);
        if (tasks[dateKey]) {
            tasks[dateKey] = tasks[dateKey].filter(task => task.id !== taskId);
        }
    }
    editingTask = null;
    saveToStorage();
    renderWeekView();
}

// Storage Functions
function saveToStorage() {
    localStorage.setItem('weeklyPlannerTasks', JSON.stringify(tasks));
}

function loadFromStorage() {
    const stored = localStorage.getItem('weeklyPlannerTasks');
    if (stored) {
        tasks = JSON.parse(stored);
    }
}

// Rendering functions
function renderTaskCard(task, date) {
    const allTodoItemsComplete = task.isTodoList && 
        task.todoItems?.length > 0 && 
        task.todoItems.every(item => item.completed);
    const isTaskComplete = task.isTodoList ? allTodoItemsComplete : task.completed;
    const dateKey = formatDate(date);

    if (editingTask && editingTask.id === task.id && editingTask.date === dateKey) {
        return renderEditMode(task, date);
    } else {
        return renderViewMode(task, date, isTaskComplete, dateKey);
    }
}

function renderEditMode(task, date) {
    const div = document.createElement('div');
    div.className = 'task-edit';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-input';
    input.value = task.text;
    input.addEventListener('input', (e) => {
        updateTask(date, task.originalId || task.id, { text: e.target.value }, task.isDaily);
    });
    div.appendChild(input);

    if (task.isTodoList) {
        const todoSection = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'todo-section-title';
        title.textContent = 'To-Do Items:';
        todoSection.appendChild(title);

        (task.todoItems || []).forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'todo-edit-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-edit-checkbox';
            checkbox.checked = item.completed;
            checkbox.addEventListener('change', () => {
                toggleTodoItem(date, task.originalId || task.id, item.id, task.isDaily);
            });

            const itemInput = document.createElement('input');
            itemInput.type = 'text';
            itemInput.className = 'todo-edit-input' + (item.completed ? ' completed' : '');
            itemInput.value = item.text;
            itemInput.addEventListener('input', (e) => {
                updateTodoItem(date, task.originalId || task.id, item.id, e.target.value, task.isDaily);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-todo-btn';
            deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.addEventListener('click', () => {
                deleteTodoItem(date, task.originalId || task.id, item.id, task.isDaily);
            });

            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(itemInput);
            itemDiv.appendChild(deleteBtn);
            todoSection.appendChild(itemDiv);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'add-todo-btn';
        addBtn.textContent = '+ Add Item';
        addBtn.addEventListener('click', () => {
            addTodoItem(date, task.originalId || task.id, task.isDaily);
        });
        todoSection.appendChild(addBtn);
        div.appendChild(todoSection);
    }

    const colorSection = document.createElement('div');
    colorSection.className = 'color-section';
    const colorLabel = document.createElement('span');
    colorLabel.className = 'color-label';
    colorLabel.textContent = 'Color:';
    colorSection.appendChild(colorLabel);

    const colorOptions = document.createElement('div');
    colorOptions.className = 'color-options';
    colors.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn' + (task.color === color ? ' selected' : '');
        btn.style.backgroundColor = color;
        btn.addEventListener('click', () => {
            updateTask(date, task.originalId || task.id, { color }, task.isDaily);
        });
        colorOptions.appendChild(btn);
    });
    colorSection.appendChild(colorOptions);
    div.appendChild(colorSection);

    if (!task.isDaily && !task.isTodoList) {
        const dailyLabel = document.createElement('label');
        dailyLabel.className = 'daily-checkbox-label';
        const dailyCheckbox = document.createElement('input');
        dailyCheckbox.type = 'checkbox';
        dailyCheckbox.className = 'daily-checkbox';
        dailyCheckbox.checked = task.isDaily;
        dailyCheckbox.addEventListener('change', (e) => {
            updateTask(date, task.id, { isDaily: e.target.checked }, false);
        });
        const dailyText = document.createElement('span');
        dailyText.className = 'daily-label-text';
        dailyText.textContent = 'Make this a daily task';
        dailyLabel.appendChild(dailyCheckbox);
        dailyLabel.appendChild(dailyText);
        div.appendChild(dailyLabel);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    if (!task.isTodoList) {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        completeBtn.innerHTML += task.completed ? ' Mark Incomplete' : ' Mark Complete';
        completeBtn.addEventListener('click', () => {
            toggleTaskComplete(date, task.originalId || task.id, task.isDaily, task.dateKey);
        });
        actions.appendChild(completeBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    deleteBtn.addEventListener('click', () => {
        deleteTask(date, task.originalId || task.id, task.isDaily);
    });
    actions.appendChild(deleteBtn);
    div.appendChild(actions);

    const doneBtn = document.createElement('button');
    doneBtn.className = 'done-editing-btn';
    doneBtn.textContent = 'Done Editing';
    doneBtn.addEventListener('click', () => {
        editingTask = null;
        renderWeekView();
    });
    div.appendChild(doneBtn);

    return div;
}

function renderViewMode(task, date, isTaskComplete, dateKey) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.style.backgroundColor = task.color;
    div.style.opacity = isTaskComplete ? '0.6' : '1';
    div.addEventListener('click', () => {
        editingTask = { id: task.id, date: dateKey };
        renderWeekView();
    });

    const content = document.createElement('div');
    content.className = 'task-content';

    const text = document.createElement('div');
    text.className = 'task-text' + (isTaskComplete ? ' completed' : '');
    text.textContent = task.text;
    content.appendChild(text);

    if (isTaskComplete) {
        const checkIcon = document.createElement('svg');
        checkIcon.className = 'check-icon';
        checkIcon.setAttribute('viewBox', '0 0 24 24');
        checkIcon.setAttribute('fill', 'none');
        checkIcon.setAttribute('stroke', 'white');
        checkIcon.setAttribute('stroke-width', '2');
        checkIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
        content.appendChild(checkIcon);
    }

    div.appendChild(content);

    if (task.isTodoList && task.todoItems?.length > 0) {
        const todoItems = document.createElement('div');
        todoItems.className = 'todo-items';
        task.todoItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'todo-item';

            const checkbox = document.createElement('div');
            checkbox.className = 'todo-checkbox' + (item.completed ? ' checked' : '');
            if (item.completed) {
                checkbox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="' + task.color + '" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
            itemDiv.appendChild(checkbox);

            const itemText = document.createElement('span');
            itemText.className = 'todo-text' + (item.completed ? ' completed' : '');
            itemText.textContent = item.text;
            itemDiv.appendChild(itemText);

            todoItems.appendChild(itemDiv);
        });
        div.appendChild(todoItems);
    }

    if (task.isDaily) {
        const tag = document.createElement('div');
        tag.className = 'daily-tag';
        tag.textContent = 'Daily Task';
        div.appendChild(tag);
    }

    if (isTaskComplete) {
        const overlay = document.createElement('div');
        overlay.className = 'task-overlay';
        div.appendChild(overlay);
    }

    return div;
}

function renderWeekView() {
    const weekContainer = document.getElementById('weekContainer');
    weekContainer.innerHTML = '';

    const weekDates = getWeekDates(currentWeekStart);

    weekDates.forEach(date => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';

        const header = document.createElement('div');
        header.className = 'day-header';
        const dayName = document.createElement('div');
        dayName.className = 'day-name';
        dayName.textContent = getDayName(date);
        const dayDate = document.createElement('div');
        dayDate.className = 'day-date';
        dayDate.textContent = getDateDisplay(date);
        header.appendChild(dayName);
        header.appendChild(dayDate);
        dayColumn.appendChild(header);

        const tasksList = document.createElement('div');
        tasksList.className = 'tasks-list';

        const dayTasks = getTasksForDate(date);
        dayTasks.forEach(task => {
            tasksList.appendChild(renderTaskCard(task, date));
        });

        const addTaskBtn = document.createElement('button');
        addTaskBtn.className = 'add-task-btn';
        addTaskBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Task';
        addTaskBtn.addEventListener('click', () => addTask(date, false));
        tasksList.appendChild(addTaskBtn);

        const addTodoBtn = document.createElement('button');
        addTodoBtn.className = 'add-task-btn todo-list';
        addTodoBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add To-Do List';
        addTodoBtn.addEventListener('click', () => addTask(date, true));
        tasksList.appendChild(addTodoBtn);

        dayColumn.appendChild(tasksList);
        weekContainer.appendChild(dayColumn);
    });
    
    // Refocus the input after render if we're editing
    if (editingTask) {
        setTimeout(() => {
            const activeInput = document.querySelector('.task-input');
            if (activeInput) {
                activeInput.focus();
                // Move cursor to end
                activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
            }
        }, 0);
    }
}

function renderMonthView() {
    const monthTitle = document.getElementById('monthTitle');
    const today = new Date();
    monthTitle.textContent = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    const monthDates = getMonthDates();
    const today2 = new Date();

    monthDates.forEach(dateObj => {
        const { date, isCurrentMonth } = dateObj;
        const dateKey = formatDate(date);
        const dayTasks = getTasksForDate(date);
        const isToday = date.toDateString() === today2.toDateString();

        const cell = document.createElement('div');
        cell.className = 'calendar-cell' + 
            (isCurrentMonth ? ' current-month' : ' other-month') +
            (isToday ? ' today' : '');
        cell.addEventListener('click', () => {
            currentWeekStart = date;
            setViewMode('week');
        });

        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-date' + 
            (isCurrentMonth ? ' current-month' : ' other-month') +
            (isToday ? ' today' : '');
        dateDiv.textContent = date.getDate();
        cell.appendChild(dateDiv);

        const taskBars = document.createElement('div');
        taskBars.className = 'task-bars';
        dayTasks.slice(0, 3).forEach(task => {
            const allTodoItemsComplete = task.isTodoList && 
                task.todoItems?.length > 0 && 
                task.todoItems.every(item => item.completed);
            const isTaskComplete = task.isTodoList ? allTodoItemsComplete : task.completed;

            const bar = document.createElement('div');
            bar.className = 'task-bar' + (isTaskComplete ? ' completed' : '');
            bar.style.backgroundColor = task.color;
            taskBars.appendChild(bar);
        });

        if (dayTasks.length > 3) {
            const count = document.createElement('div');
            count.className = 'task-count';
            count.textContent = `+${dayTasks.length - 3} more`;
            taskBars.appendChild(count);
        }

        cell.appendChild(taskBars);
        calendarGrid.appendChild(cell);
    });
}

function setViewMode(mode) {
    viewMode = mode;
    const weekViewBtn = document.getElementById('weekViewBtn');
    const monthViewBtn = document.getElementById('monthViewBtn');
    const weekView = document.getElementById('weekView');
    const monthView = document.getElementById('monthView');

    if (mode === 'week') {
        weekViewBtn.classList.add('view-btn-active');
        monthViewBtn.classList.remove('view-btn-active');
        weekView.classList.remove('hidden');
        monthView.classList.add('hidden');
        renderWeekView();
    } else {
        monthViewBtn.classList.add('view-btn-active');
        weekViewBtn.classList.remove('view-btn-active');
        monthView.classList.remove('hidden');
        weekView.classList.add('hidden');
        renderMonthView();
    }
}

function setActiveTab(tab) {
    activeTab = tab;
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('nav-btn-active');
        } else {
            btn.classList.remove('nav-btn-active');
        }
    });

    const weekView = document.getElementById('weekView');
    const monthView = document.getElementById('monthView');
    const otherTabsView = document.getElementById('otherTabsView');

    if (tab === 'planner') {
        otherTabsView.classList.add('hidden');
        if (viewMode === 'week') {
            weekView.classList.remove('hidden');
            monthView.classList.add('hidden');
            renderWeekView();
        } else {
            monthView.classList.remove('hidden');
            weekView.classList.add('hidden');
            renderMonthView();
        }
    } else {
        weekView.classList.add('hidden');
        monthView.classList.add('hidden');
        otherTabsView.classList.remove('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    
    document.getElementById('weekViewBtn').addEventListener('click', () => setViewMode('week'));
    document.getElementById('monthViewBtn').addEventListener('click', () => setViewMode('month'));

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
    });

    // Initial render
    renderWeekView();
});
