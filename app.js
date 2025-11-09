// Model danych - zadania
let tasks = [];

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', function() {
    // Inicjalizacja Materialize
    M.AutoInit();
    
    // Ładowanie zadań z localStorage
    loadTasks();
    
    // Obsługa formularza
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', handleFormSubmit);
    
    // Renderowanie zadań
    renderTasks();
});

// Obsługa dodawania/edycji zadania
function handleFormSubmit(e) {
    e.preventDefault();
    
    const taskTitleInput = document.getElementById('taskTitle');
    const taskAssigneeInput = document.getElementById('taskAssignee');
    const taskId = taskForm.dataset.editingId;
    
    const taskTitle = taskTitleInput.value.trim();
    const taskAssignee = taskAssigneeInput.value.trim();
    
    if (!taskTitle) {
        M.toast({html: 'Podaj tytuł zadania!', classes: 'red'});
        return;
    }
    
    if (taskId) {
        // Edycja istniejącego zadania
        editTask(taskId, taskTitle, taskAssignee);
        taskForm.dataset.editingId = '';
        taskForm.querySelector('button').innerHTML = 'Dodaj zadanie <i class="material-icons right">add</i>';
    } else {
        // Dodawanie nowego zadania
        addTask(taskTitle, taskAssignee);
    }
    
    // Reset formularza
    taskTitleInput.value = '';
    taskAssigneeInput.value = '';
    M.updateTextFields();
}

// Dodawanie nowego zadania
function addTask(title, assignee) {
    const newTask = {
        id: Date.now().toString(),
        title: title,
        assignee: assignee || 'Nieprzypisane',
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    M.toast({html: 'Zadanie dodane!', classes: 'green'});
}

// Edycja zadania
function editTask(taskId, title, assignee) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.title = title;
        task.assignee = assignee || 'Nieprzypisane';
        saveTasks();
        renderTasks();
        M.toast({html: 'Zadanie zaktualizowane!', classes: 'green'});
    }
}

// Usuwanie zadania
function deleteTask(taskId) {
    if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        M.toast({html: 'Zadanie usunięte!', classes: 'orange'});
    }
}

// Przełączanie statusu zadania (zakończone/niezakończone)
function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        const statusText = task.completed ? 'oznaczone jako zakończone' : 'przywrócone';
        M.toast({html: `Zadanie ${statusText}!`, classes: 'blue'});
    }
}

// Przygotowanie edycji zadania
function prepareEditTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskAssignee').value = task.assignee === 'Nieprzypisane' ? '' : task.assignee;
        
        const taskForm = document.getElementById('taskForm');
        taskForm.dataset.editingId = taskId;
        taskForm.querySelector('button').innerHTML = 'Zaktualizuj zadanie <i class="material-icons right">edit</i>';
        
        M.updateTextFields();
        
        // Przewinięcie do formularza
        taskForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// Renderowanie listy zadań
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="grey-text">Brak zadań. Dodaj pierwsze zadanie!</p>';
        return;
    }
    
    // Sortowanie: niezakończone pierwsze, potem zakończone
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.completed ? 1 : -1;
    });
    
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
}

// Tworzenie elementu zadania
function createTaskElement(task) {
    const row = document.createElement('div');
    row.className = 'task-item row valign-wrapper';
    
    if (task.completed) {
        row.classList.add('completed');
    }
    
    // Kolumna z checkboxiem i tytułem
    const contentCol = document.createElement('div');
    contentCol.className = 'col s12 m6';
    
    const checkboxWrapper = document.createElement('p');
    checkboxWrapper.style.margin = '0';
    
    const checkbox = document.createElement('label');
    checkbox.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''} 
               onchange="toggleTaskStatus('${task.id}')">
        <span>${escapeHtml(task.title)}</span>
    `;
    
    checkboxWrapper.appendChild(checkbox);
    contentCol.appendChild(checkboxWrapper);
    
    // Kolumna z wykonawcą
    const assigneeCol = document.createElement('div');
    assigneeCol.className = 'col s12 m3';
    assigneeCol.style.marginTop = '8px';
    
    const assigneeBadge = document.createElement('span');
    assigneeBadge.className = 'badge';
    assigneeBadge.style.backgroundColor = task.completed ? '#9e9e9e' : '#26a69a';
    assigneeBadge.style.color = 'white';
    assigneeBadge.style.padding = '4px 8px';
    assigneeBadge.style.borderRadius = '4px';
    assigneeBadge.textContent = task.assignee;
    assigneeCol.appendChild(assigneeBadge);
    
    // Kolumna z przyciskami akcji
    const actionsCol = document.createElement('div');
    actionsCol.className = 'col s12 m3';
    actionsCol.style.textAlign = 'right';
    actionsCol.style.marginTop = '8px';
    
    // Przycisk edycji
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-small waves-effect waves-light blue';
    editBtn.style.marginRight = '4px';
    editBtn.innerHTML = '<i class="material-icons">edit</i>';
    editBtn.onclick = () => prepareEditTask(task.id);
    editBtn.title = 'Edytuj zadanie';
    
    // Przycisk usuwania
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-small waves-effect waves-light red';
    deleteBtn.innerHTML = '<i class="material-icons">delete</i>';
    deleteBtn.onclick = () => deleteTask(task.id);
    deleteBtn.title = 'Usuń zadanie';
    
    actionsCol.appendChild(editBtn);
    actionsCol.appendChild(deleteBtn);
    
    // Łączenie elementów
    row.appendChild(contentCol);
    row.appendChild(assigneeCol);
    row.appendChild(actionsCol);
    
    // Stylowanie dla zakończonych zadań
    if (task.completed) {
        row.style.opacity = '0.6';
        row.style.textDecoration = 'line-through';
    }
    
    return row;
}

// Funkcja pomocnicza do escapowania HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Zapisywanie zadań do localStorage
function saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// Ładowanie zadań z localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            console.error('Błąd podczas ładowania zadań:', e);
            tasks = [];
        }
    }
}

// Eksport funkcji do globalnego zakresu (dla inline onclick)
window.toggleTaskStatus = toggleTaskStatus;
window.deleteTask = deleteTask;
window.prepareEditTask = prepareEditTask;

