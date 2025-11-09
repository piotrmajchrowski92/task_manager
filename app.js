/**
 * APLIKACJA TODO - GŁÓWNY PLIK JAVASCRIPT
 * 
 * Ten plik zawiera całą logikę aplikacji ToDo:
 * - Zarządzanie danymi (dodawanie, edycja, usuwanie zadań)
 * - Interakcje z użytkownikiem (formularze, przyciski)
 * - Persystencja danych (localStorage)
 * - Renderowanie interfejsu użytkownika
 */

/**
 * Model danych - tablica przechowująca wszystkie zadania
 * Każde zadanie to obiekt z właściwościami:
 * - id: unikalny identyfikator (timestamp jako string)
 * - title: tytuł zadania
 * - assignee: osoba odpowiedzialna za zadanie
 * - completed: czy zadanie jest zakończone (true/false)
 * - createdAt: data utworzenia (ISO string)
 * 
 * Zmienna jest globalna, aby była dostępna we wszystkich funkcjach.
 * W produkcji można by użyć modułów ES6 lub wzorca singleton.
 */
let tasks = [];

/**
 * INICJALIZACJA APLIKACJI
 * 
 * Event listener 'DOMContentLoaded' uruchamia się, gdy cały HTML jest załadowany,
 * ale zanim obrazy i style są w pełni załadowane. To najlepszy moment na inicjalizację,
 * ponieważ mamy pewność, że wszystkie elementy DOM są dostępne.
 * 
 * Dlaczego nie użyć window.onload? DOMContentLoaded jest szybszy - nie czeka na obrazy,
 * co daje lepsze doświadczenie użytkownika.
 */
document.addEventListener('DOMContentLoaded', function() {
    /**
     * Inicjalizacja Materialize CSS
     * M.AutoInit() automatycznie inicjalizuje wszystkie komponenty Materialize:
     * - Input fields (animowane labelki)
     * - Modals
     * - Dropdowns
     * - I inne komponenty, które wymagają inicjalizacji JavaScript
     */
    M.AutoInit();
    
    /**
     * Ładowanie zadań z localStorage przy starcie aplikacji
     * Jeśli użytkownik wcześniej dodał zadania, zostaną one przywrócone
     */
    loadTasks();
    
    /**
     * Podpięcie obsługi zdarzenia submit do formularza
     * Gdy użytkownik kliknie "Dodaj zadanie" lub naciśnie Enter,
     * zostanie wywołana funkcja handleFormSubmit
     */
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', handleFormSubmit);
    
    /**
     * Renderowanie zadań na stronie
     * Wyświetla wszystkie zadania załadowane z localStorage lub pustą listę
     */
    renderTasks();
});

/**
 * OBSŁUGA FORMULARZA - dodawanie i edycja zadań
 * 
 * Ta funkcja obsługuje zarówno dodawanie nowych zadań, jak i edycję istniejących.
 * Mechanizm działa następująco:
 * 1. Gdy użytkownik klika "Edytuj" przy zadaniu, przygotowujemy formularz do edycji
 * 2. W data-attribute formularza zapisujemy ID edytowanego zadania
 * 3. Tutaj sprawdzamy, czy formularz jest w trybie edycji (taskId istnieje)
 * 4. Jeśli tak - edytujemy zadanie, jeśli nie - dodajemy nowe
 * 
 * @param {Event} e - obiekt zdarzenia submit z formularza
 */
function handleFormSubmit(e) {
    /**
     * preventDefault() - bardzo ważne!
     * Domyślnie przeglądarka po submit formularza próbuje wysłać dane na serwer
     * i przeładować stronę. Ponieważ to aplikacja frontendowa bez backendu,
     * musimy zablokować domyślne zachowanie, aby strona się nie przeładowała.
     */
    e.preventDefault();
    
    // Pobranie referencji do pól formularza
    const taskTitleInput = document.getElementById('taskTitle');
    const taskAssigneeInput = document.getElementById('taskAssignee');
    
    /**
     * Sprawdzenie, czy formularz jest w trybie edycji
     * Gdy klikamy "Edytuj", funkcja prepareEditTask() ustawia data-editing-id
     * na ID zadania. Jeśli ten atrybut istnieje, edytujemy zadanie.
     */
    const taskForm = document.getElementById('taskForm');
    const taskId = taskForm.dataset.editingId;
    
    /**
     * Pobranie wartości z pól formularza
     * .trim() usuwa białe znaki z początku i końca - ważne dla walidacji
     * Przykład: "  zadanie  " -> "zadanie"
     */
    const taskTitle = taskTitleInput.value.trim();
    const taskAssignee = taskAssigneeInput.value.trim();
    
    /**
     * WALIDACJA - sprawdzenie, czy tytuł zadania został podany
     * Jeśli nie, wyświetlamy toast notification (małe powiadomienie Materialize)
     * i przerywamy wykonanie funkcji (return)
     */
    if (!taskTitle) {
        /**
         * M.toast() - komponent Materialize do wyświetlania powiadomień
         * html: treść powiadomienia
         * classes: klasy CSS (red = czerwony kolor dla błędu)
         */
        M.toast({html: 'Podaj tytuł zadania!', classes: 'red'});
        return; // Przerywamy wykonanie - zadanie nie zostanie dodane/edytowane
    }
    
    /**
     * ROZWIDLENIE LOGIKI: dodawanie vs edycja
     * 
     * Jeśli taskId istnieje, znaczy że edytujemy istniejące zadanie.
     * W przeciwnym razie dodajemy nowe zadanie.
     */
    if (taskId) {
        /**
         * TRYB EDYCJI
         * Wywołujemy funkcję edycji zadania z ID, nowym tytułem i wykonawcą
         */
        editTask(taskId, taskTitle, taskAssignee);
        
        /**
         * Reset formularza do trybu dodawania
         * Usuwamy data-editing-id, aby następne submit było dodawaniem, a nie edycją
         */
        taskForm.dataset.editingId = '';
        
        /**
         * Zmiana tekstu i ikony przycisku z powrotem na "Dodaj zadanie"
         * Podczas edycji przycisk pokazuje "Zaktualizuj zadanie", teraz wracamy do domyślnego stanu
         */
        taskForm.querySelector('button').innerHTML = 'Dodaj zadanie <i class="material-icons right">add</i>';
    } else {
        /**
         * TRYB DODAWANIA
         * Wywołujemy funkcję dodawania nowego zadania
         */
        addTask(taskTitle, taskAssignee);
    }
    
    /**
     * RESET FORMULARZA
     * Po dodaniu/edytowaniu zadania czyścimy pola formularza,
     * aby użytkownik mógł od razu dodać kolejne zadanie
     */
    taskTitleInput.value = '';
    taskAssigneeInput.value = '';
    
    /**
     * M.updateTextFields() - funkcja Materialize
     * Po zmianie wartości input field programatycznie (nie przez użytkownika),
     * Materialize nie aktualizuje automatycznie pozycji labelki.
     * Ta funkcja wymusza aktualizację, aby labelki wróciły na górę.
     */
    M.updateTextFields();
}

/**
 * DODAWANIE NOWEGO ZADANIA
 * 
 * Tworzy nowy obiekt zadania i dodaje go do tablicy tasks.
 * Następnie zapisuje do localStorage i odświeża widok.
 * 
 * @param {string} title - tytuł zadania (wymagany)
 * @param {string} assignee - osoba odpowiedzialna (opcjonalna)
 */
function addTask(title, assignee) {
    /**
     * Tworzenie nowego obiektu zadania
     * Struktura obiektu:
     * - id: unikalny identyfikator używany do identyfikacji zadania
     *       Date.now() zwraca timestamp w milisekundach (np. 1703123456789)
     *       .toString() konwertuje na string, aby móc zapisać w JSON
     *       Dlaczego timestamp? Jest unikalny i łatwy do wygenerowania
     * 
     * - title: tytuł zadania podany przez użytkownika
     * 
     * - assignee: wykonawca zadania
     *             operator || sprawdza, czy assignee ma wartość
     *             Jeśli assignee jest pusty/null/undefined, używa 'Nieprzypisane'
     *             To zapewnia, że każde zadanie zawsze ma wykonawcę (nawet domyślnego)
     * 
     * - completed: status zadania - domyślnie false (niezakończone)
     * 
     * - createdAt: data utworzenia w formacie ISO (np. "2023-12-21T10:30:00.000Z")
     *              Używamy ISO, ponieważ jest to standardowy format daty w JSON
     *              Pozwala to później sortować zadania po dacie
     */
    const newTask = {
        id: Date.now().toString(),
        title: title,
        assignee: assignee || 'Nieprzypisane', // Jeśli assignee jest pusty, użyj 'Nieprzypisane'
        completed: false, // Nowe zadanie zawsze jest niezakończone
        createdAt: new Date().toISOString() // Data w formacie ISO dla łatwego sortowania
    };
    
    /**
     * Dodanie zadania do tablicy tasks
     * .push() dodaje element na końcu tablicy
     */
    tasks.push(newTask);
    
    /**
     * Zapisanie zadań do localStorage
     * Musimy zapisać po każdej zmianie, aby dane przetrwały odświeżenie strony
     */
    saveTasks();
    
    /**
     * Odświeżenie widoku listy zadań
     * Funkcja renderTasks() odczyta zaktualizowaną tablicę tasks
     * i wyświetli wszystkie zadania (włącznie z nowo dodanym)
     */
    renderTasks();
    
    /**
     * Wyświetlenie powiadomienia o sukcesie
     * Toast notification w kolorze zielonym informuje użytkownika,
     * że operacja się powiodła
     */
    M.toast({html: 'Zadanie dodane!', classes: 'green'});
}

/**
 * EDYCJA ISTNIEJĄCEGO ZADANIA
 * 
 * Znajduje zadanie po ID i aktualizuje jego właściwości.
 * 
 * @param {string} taskId - unikalny identyfikator zadania do edycji
 * @param {string} title - nowy tytuł zadania
 * @param {string} assignee - nowy wykonawca zadania
 */
function editTask(taskId, title, assignee) {
    /**
     * Wyszukiwanie zadania w tablicy tasks
     * .find() iteruje po tablicy i zwraca pierwszy element spełniający warunek
     * t => t.id === taskId to funkcja arrow (lambda) sprawdzająca, czy ID się zgadza
     * 
     * Jeśli zadanie nie zostanie znalezione, task będzie undefined
     */
    const task = tasks.find(t => t.id === taskId);
    
    /**
     * Sprawdzenie, czy zadanie zostało znalezione
     * To zabezpieczenie na wypadek, gdyby ID było nieprawidłowe
     * (np. zadanie zostało usunięte przed edycją)
     */
    if (task) {
        /**
         * Aktualizacja właściwości zadania
         * Bezpośrednia modyfikacja obiektu w tablicy - JavaScript używa referencji,
         * więc zmiana obiektu task automatycznie zmienia obiekt w tablicy tasks
         */
        task.title = title;
        task.assignee = assignee || 'Nieprzypisane'; // Tak jak przy dodawaniu - domyślna wartość
        
        /**
         * Zapisanie zmian do localStorage
         * Ważne: zapisujemy po każdej zmianie, aby dane były aktualne
         */
        saveTasks();
        
        /**
         * Odświeżenie widoku
         * Wyświetli zaktualizowane zadanie z nowymi danymi
         */
        renderTasks();
        
        /**
         * Powiadomienie o sukcesie edycji
         */
        M.toast({html: 'Zadanie zaktualizowane!', classes: 'green'});
    }
    /**
     * Jeśli task nie został znalezione, funkcja po prostu kończy działanie
     * W rzeczywistej aplikacji można by dodać obsługę błędu (np. toast z komunikatem)
     */
}

/**
 * USUWANIE ZADANIA
 * 
 * Usuwa zadanie z tablicy tasks po potwierdzeniu przez użytkownika.
 * Używa okna dialogowego confirm() do potwierdzenia operacji,
 * aby uniknąć przypadkowego usunięcia.
 * 
 * @param {string} taskId - unikalny identyfikator zadania do usunięcia
 */
function deleteTask(taskId) {
    /**
     * Potwierdzenie usunięcia przez użytkownika
     * confirm() wyświetla natywne okno dialogowe przeglądarki z przyciskami OK/Anuluj
     * Zwraca true, jeśli użytkownik kliknął OK, false w przeciwnym razie
     * 
     * Dlaczego potwierdzenie? Usuwanie jest operacją nieodwracalną,
     * więc warto dać użytkownikowi szansę na anulowanie
     */
    if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
        /**
         * Usunięcie zadania z tablicy
         * .filter() tworzy nową tablicę zawierającą tylko elementy spełniające warunek
         * t => t.id !== taskId zwraca true dla wszystkich zadań OPRÓCZ tego, które chcemy usunąć
         * 
         * Przykład:
         * tasks = [{id: '1', title: 'A'}, {id: '2', title: 'B'}, {id: '3', title: 'C'}]
         * taskId = '2'
         * Po filter: tasks = [{id: '1', title: 'A'}, {id: '3', title: 'C'}]
         * 
         * Dlaczego .filter() zamiast .splice()?
         * - .filter() jest bardziej funkcjonalne i czytelne
         * - Nie trzeba znać indeksu elementu
         * - Zwraca nową tablicę (immutability - lepsza praktyka)
         */
        tasks = tasks.filter(t => t.id !== taskId);
        
        /**
         * Zapisanie zaktualizowanej tablicy do localStorage
         * Po usunięciu zadania z tablicy, zapisujemy zmiany,
         * aby po odświeżeniu strony zadanie nie wróciło
         */
        saveTasks();
        
        /**
         * Odświeżenie widoku
         * Lista zadań zostanie wyrenderowana ponownie bez usuniętego zadania
         */
        renderTasks();
        
        /**
         * Powiadomienie o usunięciu
         * Kolor orange (pomarańczowy) sygnalizuje operację destrukcyjną,
         * ale nie jest tak alarmujący jak czerwony (błąd)
         */
        M.toast({html: 'Zadanie usunięte!', classes: 'orange'});
    }
    /**
     * Jeśli użytkownik kliknął "Anuluj", funkcja kończy działanie
     * i zadanie pozostaje w tablicy
     */
}

/**
 * PRZEŁĄCZANIE STATUSU ZADANIA (zakończone ↔ niezakończone)
 * 
 * Zmienia status zadania z zakończonego na niezakończone i odwrotnie.
 * Ta funkcja obsługuje zarówno zaznaczanie jako zakończone,
 * jak i przywracanie przypadkowo zamkniętych zadań.
 * 
 * @param {string} taskId - unikalny identyfikator zadania
 */
function toggleTaskStatus(taskId) {
    /**
     * Wyszukiwanie zadania w tablicy
     * Analogicznie jak w funkcji editTask()
     */
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        /**
         * Przełączenie statusu zadania
         * Operator ! (NOT) neguje wartość boolean:
         * - Jeśli task.completed === true, to !true === false
         * - Jeśli task.completed === false, to !false === true
         * 
         * Przykład działania:
         * 1. Zadanie jest niezakończone (completed: false)
         * 2. Użytkownik klika checkbox
         * 3. task.completed = !false = true (zadanie zakończone)
         * 4. Użytkownik klika checkbox ponownie
         * 5. task.completed = !true = false (zadanie przywrócone)
         * 
         * To rozwiązanie obsługuje oba wymagania:
         * - Zaznaczanie jako zakończone (false -> true)
         * - Przywracanie przypadkowo zamkniętych (true -> false)
         */
        task.completed = !task.completed;
        
        /**
         * Zapisanie zmiany statusu do localStorage
         */
        saveTasks();
        
        /**
         * Odświeżenie widoku
         * Zadanie zakończone będzie wyświetlone inaczej (wyszarzone, przekreślone)
         * i prawdopodobnie przesunięte na dół listy (zależnie od sortowania)
         */
        renderTasks();
        
        /**
         * Dynamiczne powiadomienie w zależności od akcji
         * Używamy operatora ternarnego (warunek ? wartość1 : wartość2)
         * do wyboru odpowiedniego tekstu powiadomienia
         * 
         * Template string (backtick `) pozwala na wstawienie zmiennej do tekstu
         * ${statusText} zostanie zastąpione wartością zmiennej
         */
        const statusText = task.completed ? 'oznaczone jako zakończone' : 'przywrócone';
        M.toast({html: `Zadanie ${statusText}!`, classes: 'blue'});
    }
}

/**
 * PRZYGOTOWANIE FORMULARZA DO EDYCJI ZADANIA
 * 
 * Ta funkcja jest wywoływana, gdy użytkownik kliknie przycisk "Edytuj" przy zadaniu.
 * Wypełnia formularz danymi zadania i przełącza formularz w tryb edycji.
 * 
 * Mechanizm edycji:
 * 1. Użytkownik klika "Edytuj" przy zadaniu
 * 2. Ta funkcja wypełnia formularz danymi zadania
 * 3. W data-attribute formularza zapisujemy ID edytowanego zadania
 * 4. Zmieniamy tekst przycisku na "Zaktualizuj zadanie"
 * 5. Gdy użytkownik kliknie submit, handleFormSubmit() wykryje tryb edycji
 * 6. Zamiast dodawać nowe zadanie, zaktualizuje istniejące
 * 
 * @param {string} taskId - unikalny identyfikator zadania do edycji
 */
function prepareEditTask(taskId) {
    /**
     * Wyszukiwanie zadania do edycji
     */
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        /**
         * Wypełnienie pól formularza danymi zadania
         * .value ustawia wartość pola input
         * 
         * Dla wykonawcy: jeśli wartość to 'Nieprzypisane' (domyślna),
         * wyświetlamy pusty string w polu, aby użytkownik mógł wpisać nową wartość
         */
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskAssignee').value = task.assignee === 'Nieprzypisane' ? '' : task.assignee;
        
        /**
         * Przełączenie formularza w tryb edycji
         * data-attributes to sposób na przechowywanie danych w elementach HTML
         * dataset.editingId = '123' tworzy atrybut data-editing-id="123"
         * 
         * W funkcji handleFormSubmit() sprawdzamy ten atrybut,
         * aby wiedzieć, czy dodajemy nowe zadanie, czy edytujemy istniejące
         */
        const taskForm = document.getElementById('taskForm');
        taskForm.dataset.editingId = taskId;
        
        /**
         * Zmiana tekstu i ikony przycisku submit
         * Zamiast "Dodaj zadanie" pokazujemy "Zaktualizuj zadanie"
         * i zmieniamy ikonę z "add" na "edit"
         * 
         * To daje użytkownikowi jasny sygnał, że jest w trybie edycji
         */
        taskForm.querySelector('button').innerHTML = 'Zaktualizuj zadanie <i class="material-icons right">edit</i>';
        
        /**
         * Aktualizacja pól Materialize
         * Po programatycznej zmianie wartości input field,
         * Materialize musi zaktualizować pozycję labelki
         */
        M.updateTextFields();
        
        /**
         * Przewinięcie strony do formularza
         * scrollIntoView() przewija stronę tak, aby element był widoczny
         * { behavior: 'smooth' } - płynne przewinięcie zamiast natychmiastowego skoku
         * 
         * To jest UX improvement - użytkownik nie musi sam szukać formularza,
         * strona automatycznie przewinie się do niego
         */
        taskForm.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * RENDEROWANIE LISTY ZADAŃ
 * 
 * Ta funkcja jest wywoływana za każdym razem, gdy lista zadań musi zostać odświeżona:
 * - Po załadowaniu strony
 * - Po dodaniu nowego zadania
 * - Po edycji zadania
 * - Po usunięciu zadania
 * - Po zmianie statusu zadania (zakończone/niezakończone)
 * 
 * Funkcja:
 * 1. Czyści kontener z zadań
 * 2. Sprawdza, czy są jakieś zadania
 * 3. Sortuje zadania (najpierw niezakończone, potem zakończone)
 * 4. Tworzy elementy DOM dla każdego zadania
 * 5. Dodaje elementy do kontenera
 */
function renderTasks() {
    /**
     * Pobranie kontenera, do którego dodamy zadania
     * To jest div#tasksContainer z pliku index.html
     */
    const container = document.getElementById('tasksContainer');
    
    /**
     * Wyczyszczenie kontenera
     * .innerHTML = '' usuwa całą zawartość kontenera
     * 
     * Dlaczego czyścimy? Ponieważ renderujemy całą listę od nowa.
     * To prostsze niż śledzenie, które zadania się zmieniły i aktualizowanie tylko ich.
     * 
     * W przypadku większej liczby zadań można by użyć bardziej zaawansowanych technik
     * (np. Virtual DOM, diffing), ale dla aplikacji ToDo to podejście jest wystarczające.
     */
    container.innerHTML = '';
    
    /**
     * Sprawdzenie, czy są jakieś zadania
     * Jeśli tablica tasks jest pusta, wyświetlamy komunikat
     * i kończymy funkcję (return)
     */
    if (tasks.length === 0) {
        container.innerHTML = '<p class="grey-text">Brak zadań. Dodaj pierwsze zadanie!</p>';
        return; // Kończymy funkcję - nie ma zadań do wyświetlenia
    }
    
    /**
     * SORTOWANIE ZADAŃ
     * 
     * Chcemy wyświetlać zadania w następującej kolejności:
     * 1. Najpierw niezakończone zadania (completed: false)
     * 2. Potem zakończone zadania (completed: true)
     * 3. W każdej grupie: najnowsze zadania na górze
     * 
     * [...tasks] - tworzenie kopii tablicy (spread operator)
     * Dlaczego kopia? .sort() modyfikuje oryginalną tablicę.
     * Tworząc kopię, nie zmieniamy oryginalnej tablicy tasks,
     * co jest dobrą praktyką (immutability).
     * 
     * .sort((a, b) => { ... }) - funkcja sortująca
     * Funkcja porównująca zwraca:
     * - liczbę ujemną, jeśli a powinno być przed b
     * - liczbę dodatnią, jeśli a powinno być po b
     * - 0, jeśli a i b są równe
     */
    const sortedTasks = [...tasks].sort((a, b) => {
        /**
         * Jeśli oba zadania mają ten sam status (oba zakończone lub oba niezakończone),
         * sortujemy po dacie utworzenia - najnowsze pierwsze
         */
        if (a.completed === b.completed) {
            /**
             * new Date(string) konwertuje string ISO na obiekt Date
             * Date - Date zwraca różnicę w milisekundach
             * b.createdAt - a.createdAt: jeśli b jest nowsze, wynik będzie dodatni (b przed a)
             * 
             * Przykład:
             * a.createdAt = "2023-12-20T10:00:00Z"
             * b.createdAt = "2023-12-21T10:00:00Z"
             * new Date(b.createdAt) - new Date(a.createdAt) = 86400000 (1 dzień w ms)
             * Wynik dodatni -> b przed a -> najnowsze pierwsze ✓
             */
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        
        /**
         * Jeśli zadania mają różny status:
         * - Jeśli a jest zakończone (a.completed === true), zwracamy 1 (a po b)
         * - Jeśli a jest niezakończone (a.completed === false), zwracamy -1 (a przed b)
         * 
         * Operator ternarny: warunek ? wartość1 : wartość2
         * Jeśli a.completed jest true, zwróć 1, w przeciwnym razie -1
         * 
         * Efekt: niezakończone zadania (completed: false) będą przed zakończonymi (completed: true)
         */
        return a.completed ? 1 : -1;
    });
    
    /**
     * Tworzenie i dodawanie elementów zadań do kontenera
     * .forEach() iteruje po każdej pozycji w tablicy sortedTasks
     * Dla każdego zadania:
     * 1. Tworzymy element DOM (createTaskElement)
     * 2. Dodajemy go do kontenera (appendChild)
     */
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
}

/**
 * TWORZENIE ELEMENTU DOM DLA ZADANIA
 * 
 * Ta funkcja tworzy element HTML reprezentujący pojedyncze zadanie.
 * Zamiast używać szablonów HTML w kodzie, budujemy DOM programatycznie,
 * co daje nam pełną kontrolę nad strukturą i bezpieczeństwem (escapowanie HTML).
 * 
 * Struktura elementu zadania:
 * - Wiersz (row) zawierający:
 *   1. Kolumna z checkboxem i tytułem (50% szerokości)
 *   2. Kolumna z wykonawcą (25% szerokości)
 *   3. Kolumna z przyciskami akcji (25% szerokości)
 * 
 * @param {Object} task - obiekt zadania z właściwościami: id, title, assignee, completed
 * @returns {HTMLElement} - gotowy element DOM gotowy do dodania do strony
 */
function createTaskElement(task) {
    /**
     * Główny kontener wiersza zadania
     * 'task-item' - nasza własna klasa CSS do stylowania
     * 'row' - klasa Materialize do systemu siatki (grid system)
     * 'valign-wrapper' - klasa Materialize do wyrównania elementów w pionie
     */
    const row = document.createElement('div');
    row.className = 'task-item row valign-wrapper';
    
    /**
     * Dodanie klasy 'completed' dla zakończonych zadań
     * Ta klasa może być używana w CSS do dodatkowego stylowania
     * (np. wyszarzenie tła - zobacz style.css)
     */
    if (task.completed) {
        row.classList.add('completed');
    }
    
    /**
     * KOLUMNA 1: Checkbox i tytuł zadania
     * 'col s12 m6' - Materialize grid:
     *   s12: pełna szerokość na małych ekranach (small)
     *   m6: 50% szerokości na średnich i większych ekranach (medium+)
     */
    const contentCol = document.createElement('div');
    contentCol.className = 'col s12 m6';
    
    /**
     * Kontener dla checkboxa
     * Używamy <p>, aby checkbox był w osobnym bloku
     * margin: 0 usuwa domyślny margines, aby nie było zbędnych odstępów
     */
    const checkboxWrapper = document.createElement('p');
    checkboxWrapper.style.margin = '0';
    
    /**
     * Label z checkboxem Materialize
     * Materialize automatycznie styluje checkboxy wewnątrz <label>
     * 
     * Template string (backtick `) pozwala na wieloliniowy string i wstawianie zmiennych
     * ${task.completed ? 'checked' : ''} - jeśli zadanie jest zakończone, checkbox jest zaznaczony
     * 
     * onchange="toggleTaskStatus('${task.id}')" - inline handler
     * Gdy użytkownik kliknie checkbox, wywoła się funkcja toggleTaskStatus z ID zadania
     * 
     * ${escapeHtml(task.title)} - tytuł zadania z escapowaniem HTML
     * escapeHtml() zapobiega atakom XSS (Cross-Site Scripting)
     * Przykład: jeśli tytuł to "<script>alert('hack')</script>",
     * escapeHtml() zamieni < na &lt;, co wyświetli tekst zamiast wykonać kod
     */
    const checkbox = document.createElement('label');
    checkbox.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''} 
               onchange="toggleTaskStatus('${task.id}')">
        <span>${escapeHtml(task.title)}</span>
    `;
    
    /**
     * Zbudowanie struktury: checkbox -> wrapper -> kolumna
     */
    checkboxWrapper.appendChild(checkbox);
    contentCol.appendChild(checkboxWrapper);
    
    /**
     * KOLUMNA 2: Wykonawca zadania
     * 'col s12 m3' - 25% szerokości na średnich ekranach, pełna na małych
     * marginTop: '8px' - mały odstęp od góry dla lepszego wyrównania wizualnego
     */
    const assigneeCol = document.createElement('div');
    assigneeCol.className = 'col s12 m3';
    assigneeCol.style.marginTop = '8px';
    
    /**
     * Badge (odznaka) z nazwą wykonawcy
     * Badge to wizualny element wskazujący wykonawcę zadania
     * 
     * Stylowanie inline (style.backgroundColor) - dlaczego?
     * Zgodnie z wymaganiami: "Używaj jak najwięcej JavaScript a jak najmniej CSS"
     * Zamiast tworzyć klasy CSS dla każdego stanu, ustawiamy style bezpośrednio w JS
     */
    const assigneeBadge = document.createElement('span');
    assigneeBadge.className = 'badge';
    
    /**
     * Dynamiczny kolor badge w zależności od statusu zadania
     * - Zakończone zadania: szary (#9e9e9e) - mniej widoczny
     * - Niezakończone zadania: teal (#26a69a) - kolor Material Design, bardziej widoczny
     * 
     * Operator ternarny: warunek ? wartość1 : wartość2
     */
    assigneeBadge.style.backgroundColor = task.completed ? '#9e9e9e' : '#26a69a';
    assigneeBadge.style.color = 'white';
    assigneeBadge.style.padding = '4px 8px';
    assigneeBadge.style.borderRadius = '4px';
    
    /**
     * Ustawienie tekstu wykonawcy
     * .textContent zamiast .innerHTML - bezpieczniejsze, automatycznie escapuje HTML
     * Ponieważ tutaj używamy textContent (nie innerHTML), nie ma ryzyka XSS
     */
    assigneeBadge.textContent = task.assignee;
    assigneeCol.appendChild(assigneeBadge);
    
    /**
     * KOLUMNA 3: Przyciski akcji (edycja, usuwanie)
     * 'col s12 m3' - 25% szerokości
     * textAlign: 'right' - przyciski wyrównane do prawej strony
     */
    const actionsCol = document.createElement('div');
    actionsCol.className = 'col s12 m3';
    actionsCol.style.textAlign = 'right';
    actionsCol.style.marginTop = '8px';
    
    /**
     * PRZYCISK EDYCJI
     * 'btn-small' - mały przycisk Materialize
     * 'waves-effect waves-light' - efekt fali przy kliknięciu (Material Design)
     * 'blue' - niebieski kolor przycisku
     */
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-small waves-effect waves-light blue';
    editBtn.style.marginRight = '4px'; // Odstęp między przyciskami
    
    /**
     * Ikona Material Icons
     * 'edit' to nazwa ikony edycji w Material Icons
     */
    editBtn.innerHTML = '<i class="material-icons">edit</i>';
    
    /**
     * Event handler dla kliknięcia
     * Arrow function () => prepareEditTask(task.id) tworzy funkcję,
     * która wywoła prepareEditTask z ID zadania
     * 
     * Dlaczego arrow function?
     * - Zwięzła składnia
     * - Zachowuje kontekst 'this' (choć tutaj nie jest potrzebne)
     * - Łatwiejsze do odczytania
     */
    editBtn.onclick = () => prepareEditTask(task.id);
    editBtn.title = 'Edytuj zadanie'; // Tooltip przy najechaniu myszką
    
    /**
     * PRZYCISK USUWANIA
     * Analogicznie jak przycisk edycji, ale:
     * - Kolor czerwony ('red') - sygnalizuje destrukcyjną operację
     * - Ikona 'delete'
     * - Wywołuje deleteTask() zamiast prepareEditTask()
     */
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-small waves-effect waves-light red';
    deleteBtn.innerHTML = '<i class="material-icons">delete</i>';
    deleteBtn.onclick = () => deleteTask(task.id);
    deleteBtn.title = 'Usuń zadanie';
    
    /**
     * Dodanie przycisków do kolumny akcji
     */
    actionsCol.appendChild(editBtn);
    actionsCol.appendChild(deleteBtn);
    
    /**
     * ŁĄCZENIE WSZYSTKICH KOLUMN W WIERSZ
     * appendChild() dodaje element jako ostatnie dziecko rodzica
     * Kolejność: checkbox -> wykonawca -> akcje
     */
    row.appendChild(contentCol);
    row.appendChild(assigneeCol);
    row.appendChild(actionsCol);
    
    /**
     * DODATKOWE STYLOWANIE DLA ZAKOŃCZONYCH ZADAŃ
     * 
     * Zamiast używać CSS (zgodnie z wymaganiami: "jak najmniej CSS"),
     * ustawiamy style bezpośrednio w JavaScript
     * 
     * opacity: 0.6 - zmniejszenie nieprzezroczystości (zadanie wygląda na wyszarzone)
     * textDecoration: 'line-through' - przekreślenie tekstu (klasyczny znak zakończonego zadania)
     * 
     * Te style są ustawiane bezpośrednio na elemencie (inline styles),
     * co ma wyższy priorytet niż style z pliku CSS
     */
    if (task.completed) {
        row.style.opacity = '0.6';
        row.style.textDecoration = 'line-through';
    }
    
    /**
     * Zwrócenie gotowego elementu DOM
     * Ten element będzie dodany do kontenera w funkcji renderTasks()
     */
    return row;
}

/**
 * FUNKCJA POMOCNICZA: ESCAPOWANIE HTML
 * 
 * Ta funkcja zapobiega atakom XSS (Cross-Site Scripting).
 * Konwertuje znaki specjalne HTML (<, >, &, ", ') na encje HTML,
 * aby były wyświetlane jako tekst, a nie interpretowane jako kod HTML.
 * 
 * Przykład:
 * Input:  "<script>alert('hack')</script>"
 * Output: "&lt;script&gt;alert(&#39;hack&#39;)&lt;/script&gt;"
 * 
 * Bez escapowania: przeglądarka wykonałaby kod JavaScript (atak!)
 * Z escapowaniem: przeglądarka wyświetli tekst "<script>alert('hack')</script>"
 * 
 * @param {string} text - tekst do escapowania
 * @returns {string} - tekst z escapowanymi znakami specjalnymi HTML
 */
function escapeHtml(text) {
    /**
     * Tworzenie tymczasowego elementu DOM
     * Używamy <div>, ale moglibyśmy użyć dowolnego elementu
     */
    const div = document.createElement('div');
    
    /**
     * Ustawienie tekstu za pomocą textContent
     * textContent automatycznie escapuje wszystkie znaki specjalne HTML
     * Przykład: jeśli text = "<script>", to textContent ustawi "&lt;script&gt;"
     */
    div.textContent = text;
    
    /**
     * Pobranie zawartości jako HTML
     * innerHTML zwraca tekst z już escapowanymi znakami
     * 
     * Jak to działa?
     * 1. textContent = "<script>" -> browser przechowuje jako tekst
     * 2. innerHTML -> browser konwertuje na HTML: "&lt;script&gt;"
     * 
     * To jest bezpieczny sposób escapowania, ponieważ wykorzystujemy
     * wbudowaną funkcjonalność przeglądarki, która zawsze poprawnie escapuje HTML
     */
    return div.innerHTML;
}

/**
 * ZAPISYWANIE ZADAŃ DO LOCALSTORAGE
 * 
 * localStorage to mechanizm przeglądarki do przechowywania danych lokalnie
 * (na komputerze użytkownika). Dane przetrwają:
 * - Odświeżenie strony
 * - Zamknięcie przeglądarki
 * - Restart komputera
 * 
 * Dane NIE przetrwają:
 * - Wyczyszczenia cache przeglądarki
 * - Usunięcia danych strony
 * - Trybu incognito (zależnie od przeglądarki)
 * 
 * localStorage może przechowywać tylko stringi, więc musimy skonwertować
 * tablicę obiektów na JSON (JavaScript Object Notation).
 * 
 * Wywoływana po każdej zmianie danych (dodanie, edycja, usunięcie, zmiana statusu).
 */
function saveTasks() {
    /**
     * Konwersja tablicy tasks na string JSON
     * JSON.stringify() konwertuje obiekt JavaScript na string JSON
     * 
     * Przykład:
     * Input:  [{id: '1', title: 'Zadanie', completed: false}]
     * Output: '[{"id":"1","title":"Zadanie","completed":false}]'
     * 
     * 'todoTasks' to klucz pod którym zapisujemy dane
     * Możemy mieć wiele kluczy w localStorage (np. 'todoTasks', 'userSettings', etc.)
     */
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

/**
 * ŁADOWANIE ZADAŃ Z LOCALSTORAGE
 * 
 * Ta funkcja jest wywoływana przy starcie aplikacji (w DOMContentLoaded).
 * Przywraca zadania zapisane wcześniej przez użytkownika.
 * 
 * Jeśli nie ma zapisanych zadań (pierwsze uruchomienie), tasks pozostanie pustą tablicą.
 */
function loadTasks() {
    /**
     * Pobranie zapisanych zadań z localStorage
     * getItem() zwraca string JSON lub null, jeśli klucz nie istnieje
     */
    const savedTasks = localStorage.getItem('todoTasks');
    
    /**
     * Sprawdzenie, czy istnieją zapisane zadania
     * Jeśli savedTasks jest null, oznacza to, że użytkownik uruchamia aplikację pierwszy raz
     */
    if (savedTasks) {
        /**
         * Konwersja stringa JSON z powrotem na tablicę obiektów JavaScript
         * JSON.parse() jest odwrotnością JSON.stringify()
         * 
         * Przykład:
         * Input:  '[{"id":"1","title":"Zadanie","completed":false}]'
         * Output: [{id: '1', title: 'Zadanie', completed: false}]
         * 
         * TRY-CATCH - obsługa błędów
         * JSON.parse() może rzucić wyjątek, jeśli string JSON jest nieprawidłowy
         * (np. został uszkodzony, ręcznie zmodyfikowany w DevTools)
         */
        try {
            /**
             * Próba parsowania JSON
             * Jeśli się powiedzie, tasks zostanie wypełnione danymi
             */
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            /**
             * OBSŁUGA BŁĘDU
             * Jeśli JSON jest nieprawidłowy, łapiemy wyjątek i:
             * 1. Logujemy błąd do konsoli (dla developera)
             * 2. Ustawiamy tasks na pustą tablicę (aplikacja działa dalej)
             * 
             * Dlaczego nie pokazujemy błędu użytkownikowi?
             * - Użytkownik prawdopodobnie nie wie, co to znaczy
             * - Aplikacja nadal działa (po prostu bez starych danych)
             * - W produkcji można by dodać bardziej przyjazny komunikat
             */
            console.error('Błąd podczas ładowania zadań:', e);
            tasks = []; // Bezpieczna wartość domyślna - pusta tablica
        }
    }
    /**
     * Jeśli savedTasks jest null, tasks pozostaje pustą tablicą (zdefiniowaną na początku pliku)
     * Nie musimy nic robić - aplikacja zacznie z pustą listą zadań
     */
}

/**
 * EKSPORT FUNKCJI DO GLOBALNEGO ZAKRESU
 * 
 * Problem: W funkcji createTaskElement() używamy inline handlerów:
 * onchange="toggleTaskStatus('${task.id}')"
 * 
 * Inline handlery są wykonywane w kontekście globalnym (window),
 * więc funkcje muszą być dostępne w obiekcie window.
 * 
 * W JavaScript funkcje zdefiniowane przez 'function' są automatycznie
 * dostępne w zakresie, w którym zostały zdefiniowane, ale nie w window,
 * chyba że je tam jawnie przypiszemy.
 * 
 * Rozwiązanie: Przypisujemy funkcje do window, aby były dostępne globalnie.
 * 
 * Alternatywne rozwiązania (lepsze w produkcji):
 * 1. Użycie addEventListener zamiast inline handlerów
 * 2. Użycie event delegation (jeden listener na kontenerze)
 * 3. Użycie frameworków (React, Vue) - ale to poza zakresem tego projektu
 * 
 * Tutaj używamy inline handlerów, ponieważ:
 * - To prostsze dla małej aplikacji
 * - Zgodne z wymaganiami (Vanilla JS, bez frameworków)
 * - Łatwe do zrozumienia
 */
window.toggleTaskStatus = toggleTaskStatus;
window.deleteTask = deleteTask;
window.prepareEditTask = prepareEditTask;

