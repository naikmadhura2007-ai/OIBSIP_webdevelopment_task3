document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const searchInput = document.getElementById('search-input');
    const pendingList = document.getElementById('pending-list');
    const completedList = document.getElementById('completed-list');
    const pendingCount = document.getElementById('pending-count');
    const completedCount = document.getElementById('completed-count');
    const progressBar = document.getElementById('progress-bar');
    const tabBtns = document.querySelectorAll('.tab');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const completedFooter = document.getElementById('completed-footer');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentSearchQuery = '';

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            completedAt: null
        };

        tasks.unshift(newTask); // Add new tasks to the top
        taskInput.value = '';
        saveTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
    }

    function toggleComplete(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                const isCompleted = !task.completed;
                return {
                    ...task,
                    completed: isCompleted,
                    completedAt: isCompleted ? new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : null
                };
            }
            return task;
        });
        saveTasks();
    }

    function startInlineEdit(id, element) {
        const task = tasks.find(t => t.id === id);
        if (!task || task.completed) return;

        const taskTextContainer = element.querySelector('.task-text');
        const originalText = task.text;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = originalText;

        taskTextContainer.innerHTML = '';
        taskTextContainer.appendChild(input);
        input.focus();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== originalText) {
                task.text = newText;
                saveTasks();
            } else {
                taskTextContainer.textContent = originalText;
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') {
                input.removeEventListener('blur', saveEdit);
                taskTextContainer.textContent = originalText;
            }
        });
    }

    function clearAllCompleted() {
        if (confirm('Are you sure you want to remove all completed tasks?')) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
        }
    }

    function updateProgress() {
        if (tasks.length === 0) {
            progressBar.style.width = '0%';
            return;
        }
        const completed = tasks.filter(t => t.completed).length;
        const percentage = (completed / tasks.length) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    function renderTasks() {
        pendingList.innerHTML = '';
        completedList.innerHTML = '';

        const filteredTasks = tasks.filter(task => 
            task.text.toLowerCase().includes(currentSearchQuery.toLowerCase())
        );

        const pendingTasks = filteredTasks.filter(t => !t.completed);
        const completedTasks = filteredTasks.filter(t => t.completed);

        // Update Counts
        pendingCount.textContent = tasks.filter(t => !t.completed).length;
        completedCount.textContent = tasks.filter(t => t.completed).length;
        updateProgress();

        // Check if "Clear Completed" should be visible
        completedFooter.style.display = (tasks.filter(t => t.completed).length > 0 && 
                                        document.querySelector('.tab[data-tab="completed"]').classList.contains('active')) 
                                        ? 'flex' : 'none';

        if (pendingTasks.length === 0) {
            pendingList.innerHTML = `
                <li class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>${currentSearchQuery ? 'No search results found.' : 'No tasks yet. Stay productive!'}</p>
                </li>`;
        } else {
            pendingTasks.forEach(task => {
                pendingList.appendChild(createTaskElement(task));
            });
        }

        if (completedTasks.length === 0) {
            completedList.innerHTML = `
                <li class="empty-state">
                    <div class="empty-icon">✅</div>
                    <p>${currentSearchQuery ? 'No completed search results.' : 'No tasks finished yet.'}</p>
                </li>`;
        } else {
            completedTasks.forEach(task => {
                completedList.appendChild(createTaskElement(task));
            });
        }
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    <span>📅 ${task.createdAt}</span>
                    ${task.completedAt ? `<span>🎯 ${task.completedAt}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                ${!task.completed ? `<button class="btn-icon btn-edit" title="Edit Task">✎</button>` : ''}
                <button class="btn-icon btn-delete" title="Delete Task" onclick="deleteTask(${task.id})">🗑</button>
            </div>
        `;

        if (!task.completed) {
            const editBtn = li.querySelector('.btn-edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                startInlineEdit(task.id, li);
            });
            // Double click to edit as well
            li.addEventListener('dblclick', () => startInlineEdit(task.id, li));
        }

        return li;
    }

    // Expose globals for onclicks
    window.toggleTask = toggleComplete;
    window.deleteTask = deleteTask;

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        renderTasks();
    });

    // Add task event listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Clear completed event listener
    clearCompletedBtn.addEventListener('click', clearAllCompleted);

    // Tab switching logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.dataset.tab;
            if (target === 'pending') {
                pendingList.style.display = 'flex';
                completedList.style.display = 'none';
                completedFooter.style.display = 'none';
            } else {
                pendingList.style.display = 'none';
                completedList.style.display = 'flex';
                completedFooter.style.display = tasks.filter(t => t.completed).length > 0 ? 'flex' : 'none';
            }
        });
    });

    // Initial render
    renderTasks();
});
