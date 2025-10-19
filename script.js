let allSets = {}; // Obiekt z wszystkimi zestawami słów { data: [słowa] }
let words = [];   // Aktualnie załadowane słowa
let currentWord = '';
let currentSet = '';

utterance.lang = 'en-GB'; // lub 'en-US'

window.onload = () => {
    loadSetsFromStorage();
    populateSetSelector();
};

// Wczytaj dane z localStorage
function loadSetsFromStorage() {
    const data = localStorage.getItem('learningWordSets');
    if (data) {
        allSets = JSON.parse(data);
    }
}

// Zapisz wszystkie zestawy do localStorage
function saveSetsToStorage() {
    localStorage.setItem('learningWordSets', JSON.stringify(allSets));
}

// Zapisz nowy zestaw słów
function saveWords() {
    const input = document.getElementById('words-input').value.trim();
    if (!input) {
        alert("Wpisz jakieś słowa!");
        return;
    }

    const wordList = input.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
    if (wordList.length === 0) {
        alert("Nie podano żadnych poprawnych słów.");
        return;
    }

    const today = new Date().toISOString().split('T')[0]; // np. 2025-10-19
    allSets[today] = wordList;
    saveSetsToStorage();
    populateSetSelector();
    alert(`Zapisano zestaw z datą ${today}`);
    document.getElementById('words-input').value = '';
}

// Wypełnij <select> dostępnymi datami
function populateSetSelector() {
    const selector = document.getElementById('set-selector');
    selector.innerHTML = '';

    const option = document.createElement('option');
    option.value = '';
    option.textContent = '-- Wybierz zestaw --';
    selector.appendChild(option);

    Object.keys(allSets).sort().forEach(date => {
        const opt = document.createElement('option');
        opt.value = date;
        opt.textContent = date;
        selector.appendChild(opt);
    });
}

// Załaduj wybrany zestaw
function loadSelectedSet() {
    const selectedDate = document.getElementById('set-selector').value;
    if (selectedDate && allSets[selectedDate]) {
        words = allSets[selectedDate];
        currentSet = selectedDate;
        alert(`Załadowano zestaw z dnia ${selectedDate}`);
        document.getElementById('status').textContent = 'Kliknij "Start Quiz", aby zacząć!';
    } else {
        words = [];
        currentSet = '';
    }
}

// Wybierz losowe słowo
function pickRandomWord() {
    currentWord = words[Math.floor(Math.random() * words.length)];
}

// Wystartuj quiz
function startQuiz() {
    if (words.length === 0) {
        alert('Najpierw wybierz lub dodaj zestaw słów!');
        return;
    }
    pickRandomWord();
    speakCurrentWord();
    document.getElementById('status').textContent = 'Posłuchaj i napisz słowo.';
    document.getElementById('answer-input').value = '';
}

// Wymowa słowa
function speakCurrentWord() {
    if (!('speechSynthesis' in window)) {
        alert("Twoja przeglądarka nie obsługuje syntezy mowy.");
        return;
    }

    const speak = () => {
        const utterance = new SpeechSynthesisUtterance(currentWord);
        utterance.lang = 'en-GB'; // lub 'en-US'

        // Wybierz preferowany głos
        const voices = speechSynthesis.getVoices();

        // Najlepsze opcje dla Safari:
        const preferredVoice = voices.find(v =>
            v.lang.startsWith('en') &&
            (
                v.name.includes("Samantha") ||
                v.name.includes("Daniel") ||
                v.name.includes("Google UK English") ||
                v.name.includes("UK") ||
                v.name.includes("US")
            )
        );

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        speechSynthesis.cancel(); // Dla pewności
        speechSynthesis.speak(utterance);
    };

    // Upewnij się, że głosy są załadowane
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = speak;
    } else {
        speak();
    }
}

// Sprawdzenie odpowiedzi
function checkAnswer() {
    const answer = document.getElementById('answer-input').value.trim().toLowerCase();
    if (answer === currentWord) {
        document.getElementById('status').textContent = 'Brawo! Poprawnie.';
        setTimeout(startQuiz, 1000);
    } else {
        document.getElementById('status').textContent = `Źle! Poprawne słowo: ${currentWord}`;
        speakCurrentWord();
    }
}

function deleteCurrentSet() {
    const selectedDate = document.getElementById('set-selector').value;
    if (!selectedDate) {
        alert("Wybierz zestaw do usunięcia.");
        return;
    }

    const confirmDelete = confirm(`Czy na pewno chcesz usunąć zestaw z dnia ${selectedDate}?`);
    if (!confirmDelete) return;

    delete allSets[selectedDate];
    saveSetsToStorage(); // zapisz zmiany
    populateSetSelector(); // odśwież dropdown
    words = [];
    currentSet = '';
    document.getElementById('status').textContent = 'Zestaw został usunięty.';
    alert(`Usunięto zestaw: ${selectedDate}`);
}


