let allSets = {}; // Obiekt z wszystkimi zestawami słów { data: [słowa] }
let words = [];   // Aktualnie załadowane słowa
let currentWord = '';
let currentSet = '';

window.onload = () => {
    loadSetsFromStorage();
    populateSetSelector();
    
    document.getElementById('answer-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            checkAnswer();
        }
    });
    // Gwarantowane załadowanie głosów (dla iOS / Safari)
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = populateVoiceSelector;

        // awaryjne wywołanie po czasie
        setTimeout(() => {
            if (speechSynthesis.getVoices().length === 0) {
                populateVoiceSelector();
            }
        }, 1500);
    }
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

        // Użyj wcześniej wybranego głosu, jeśli jest dostępny
        const voices = speechSynthesis.getVoices();

        if (!selectedVoice && localStorage.getItem('preferredVoice')) {
            selectedVoice = voices.find(v => v.name === localStorage.getItem('preferredVoice'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            // Domyślna próba
            utterance.lang = 'en-GB';
            const fallback = voices.find(v => v.name.includes("Google UK English") || v.name.includes("Samantha"));
            if (fallback) utterance.voice = fallback;
        }

        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    };

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

let selectedVoice = null;

// Załaduj dostępne głosy i wypełnij <select>
function populateVoiceSelector() {
    const selector = document.getElementById('voice-selector');
    const voices = speechSynthesis.getVoices();

    selector.innerHTML = '';

    voices
        .filter(v => v.lang.startsWith('en')) // tylko angielskie głosy
        .forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            selector.appendChild(option);
        });

    // Jeśli coś było wcześniej zapisane – wybierz to
    const savedVoice = localStorage.getItem('preferredVoice');
    if (savedVoice) {
        const found = Array.from(selector.options).find(opt => opt.value === savedVoice);
        if (found) {
            selector.value = savedVoice;
            selectedVoice = voices.find(v => v.name === savedVoice);
        }
    }
}

// Po wybraniu i kliknięciu "Odtwórz"
function testSelectedVoice() {
    const selector = document.getElementById('voice-selector');
    const voiceName = selector.value;
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === voiceName);

    if (!voice) {
        alert("Nie znaleziono wybranego głosu.");
        return;
    }

    selectedVoice = voice;
    localStorage.setItem('preferredVoice', voice.name);

    const utterance = new SpeechSynthesisUtterance("Hello! This is a test of the selected English voice.");
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}





