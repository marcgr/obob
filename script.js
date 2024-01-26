document.addEventListener("DOMContentLoaded", function () {
    let originalFlashcards = [];
    let flashcards = [];
    let currentFlashcardIndex = 0;
    let isReading = false;

    const authorFilter = document.getElementById("author-filter");
    const questionTypeFilter = document.getElementById("question-type-filter");
    const bookNameFilter = document.getElementById("book-name-filter"); // Add book name filter

    authorFilter.addEventListener("change", applyFiltersAndShowQuestion);
    questionTypeFilter.addEventListener("change", applyFiltersAndShowQuestion);
    bookNameFilter.addEventListener("change", applyFiltersAndShowQuestion); // Add event listener for book name filter


    function showLoading() {
        document.getElementById("loading-container").style.display = "flex";
    }

    function hideLoading() {
        document.getElementById("loading-container").style.display = "none";
    }

    function readText() {
        const speechSynthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance();

        const questionElement = document.getElementById("question");
        const answerElement = document.getElementById("answer");
        const showAnswerButton = document.getElementById("show-answer");
        const soundCheckbox = document.getElementById("sound-checkbox");

        const isQuestionVisible = questionElement.style.display === "block";
        const isAnswerVisible = answerElement.style.display === "block";

        if (soundCheckbox.checked) {
            if (isQuestionVisible) {
                utterance.text = questionElement.innerText;
            } else if (isAnswerVisible) {
                utterance.text = answerElement.innerText;
            } else if (showAnswerButton.style.display === "block") {
                utterance.text = questionElement.innerText;
            }

            const voices = speechSynthesis.getVoices();
            utterance.voice = voices.find(voice => voice.name === 'Google UK English Male');

            speechSynthesis.speak(utterance);
        }
    }


    showLoading();

    loadFlashcardsFromGoogleSheet();

    function loadFlashcardsFromGoogleSheet() {
        const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSKab-hn-TLPPv9tcF7ADiiYVjTgF-SQ_LkxfNhLAU1fDnH2L325T3LVsSsV733JQS14bAwb_RZTxj-/pub?gid=1180178799&single=true&output=tsv';
        fetch(googleSheetURL)
            .then(response => response.text())
            .then(data => {
                Papa.parse(data, {
                    delimiter: "\t",
                    header: false,
                    skipEmptyLines: true,
                    complete: function (results) {
                        console.log('All results', results);
                        originalFlashcards = results.data;
                        shuffleArray(originalFlashcards); // Shuffle once during the initial load
                        flashcards = [...originalFlashcards]; // Copy the shuffled data
                        populateFilterOptions();
                        applyFiltersAndShowQuestion();
                        hideLoading();
                    }
                });
            })
            .catch(error => console.error('Error loading Google Sheet data:', error));
    }


    function loadFlashcardsFromCSV() {




        fetch('OBOB_2024.tsv')
            .then(response => response.text())
            .then(data => {
                Papa.parse(data, {
                    delimiter: "\t",
                    header: false,
                    skipEmptyLines: true,
                    complete: function (results) {
                        originalFlashcards = results.data;
                        shuffleArray(originalFlashcards); // Shuffle once during the initial load
                        flashcards = [...originalFlashcards]; // Copy the shuffled data
                        populateFilterOptions();
                        applyFiltersAndShowQuestion();
                    }
                });
            })
            .catch(error => console.error('Error loading tab-delimited file:', error));
    }

    function readAnswer() {
        const speechSynthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance();

        const answerElement = document.getElementById("answer");
        utterance.text = answerElement.innerText;

        const voices = speechSynthesis.getVoices();
        utterance.voice = voices.find(voice => voice.name === 'Google UK English Female');

        speechSynthesis.speak(utterance);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }


    function shuffleAndShow() {
        flashcards = [...originalFlashcards]; // Copy the original data
        console.log("Flashcards before shuffle:", flashcards);
        shuffleArray(flashcards);
        console.log("Flashcards after shuffle:", flashcards);
        populateFilterOptions();
        applyFiltersAndShowQuestion();
    }



    function populateFilterOptions() {
        const authors = new Set(originalFlashcards.map(flashcard => flashcard[3]));
        const questionTypes = new Set(originalFlashcards.map(flashcard => flashcard[2]));
    
        authors.forEach(function (author) {
            var option = document.createElement('option');
            option.value = author;
            option.text = author;
            authorFilter.add(option);
        });
        authorFilter.setAttribute('size', authors.size);
        authorFilter.selectedIndex = -1;
        for (var i = 0; i < authorFilter.options.length; i++) {
            authorFilter.options[i].selected = true;
        }
    
        populateDropdown(questionTypeFilter, questionTypes);
    
        // Convert Set to Array and filter out empty strings
        const bookNamesArray = Array.from(new Set(originalFlashcards.map(flashcard => flashcard[4])));
        const filteredBookNamesArray = bookNamesArray.filter(name => name.trim() !== "").sort();
    
        populateDropdown(bookNameFilter, filteredBookNamesArray);
        
        // Select "All" option by default in bookNameFilter
        bookNameFilter.options[0].selected = true;
    }

    function populateDropdown(selectElement, options) {
        selectElement.innerHTML = "";
        selectElement.add(new Option("All", "all"));

        for (const option of options) {
            selectElement.add(new Option(option, option));
        }
    }

    function applyFiltersAndShowQuestion() {
        console.log("Applying filters...");
        const authorFilterValue = authorFilter.value;
        var selectedAuthors = Array.from(authorFilter.selectedOptions).map(option => option.value);
        console.log('selectedAuthors', selectedAuthors);
        const questionTypeFilterValue = questionTypeFilter.value;
        const bookNameFilterValue = bookNameFilter.value;

        const authorFilteredFlashcards = originalFlashcards.filter(flashcard => {
            const authorMatch = selectedAuthors.includes(flashcard[3]);
            const questionTypeMatch = questionTypeFilterValue === "all" || flashcard[2] === questionTypeFilterValue;
            return authorMatch && questionTypeMatch;
        });

        const finalFilteredFlashcards = authorFilteredFlashcards.filter(flashcard => {
            const bookNameMatch = bookNameFilterValue === "all" || flashcard[4] === bookNameFilterValue; // Assuming book names are in the 5th column
            return bookNameMatch;
        });

        flashcards = finalFilteredFlashcards;
        //console.log("Filtered Flashcards:", flashcards);

        // Update the filtered count
        document.getElementById("filtered-count").innerText = flashcards.length;

        if (flashcards.length > 0) {
            // Check if currentFlashcardIndex is out of bounds
            if (currentFlashcardIndex >= flashcards.length) {
                currentFlashcardIndex = 0;
            }
            showQuestion();
        } else {
            alert("No matching flashcards found!");
        }
    }

    function showQuestion() {
        const flashcard = document.getElementById("flashcard-content");
        const questionElement = document.getElementById("question");
        const answerElement = document.getElementById("answer");
        const showAnswerButton = document.getElementById("show-answer");
        const soundCheckbox = document.getElementById("sound-checkbox");
        const nextButton = document.getElementById("next-button");

        if (currentFlashcardIndex < flashcards.length) {
            const currentFlashcard = flashcards[currentFlashcardIndex];

            const questionIndex = 0;
            const answerIndex = 1;
            const authorIndex = 3; // Assuming Author is in the 4th column
            const questionTypeIndex = 2; // Assuming QuestionType is in the 3rd column

            // Update the displayed information
            document.getElementById("question").innerText = `Question: ${currentFlashcard[questionIndex]}`;
            document.getElementById("answer").innerText = `Answer: ${currentFlashcard[answerIndex]}`;
            document.getElementById("current-author").innerText = currentFlashcard[authorIndex];
            document.getElementById("current-question-type").innerText = currentFlashcard[questionTypeIndex];
            document.getElementById("current-index").innerText = currentFlashcardIndex + 1; // Add 1 to display human-readable index

            // Dynamically control the visibility of the Previous button
            const prevButton = document.getElementById("prev-button");
            prevButton.style.display = currentFlashcardIndex > 0 ? "inline-block" : "none";

            questionElement.innerText = `Question: ${currentFlashcard[questionIndex]}`;
            answerElement.innerText = `Answer: ${currentFlashcard[answerIndex]}`;
            flashcard.style.display = "block";

            showAnswerButton.style.display = "block";
            answerElement.style.display = "none";
            soundCheckbox.style.display = "block";

            if (soundCheckbox.checked) {
                readText(currentFlashcard[questionIndex]);
            }

            showAnswerButton.onclick = function () {
                answerElement.style.display = "block";
                showAnswerButton.style.display = "none";
                nextButton.style.display = "block";

                if (soundCheckbox.checked) {
                    // Read the answer only when the "Show Answer" button is clicked
                    readText();
                }
            };

            nextButton.onclick = function () {
                console.log("Next button clicked. Current index:", currentFlashcardIndex);
                currentFlashcardIndex++;

                document.getElementById("answer").style.display = "none";
                applyFiltersAndShowQuestion();
                nextButton.style.display = "none";

                // Check if the answer is already displayed
                if (answerElement.style.display === "block") {
                    if (soundCheckbox.checked) {
                        // Read the answer only if it was not read before
                        readText();
                    }
                }
            };



        } else {
            alert("No more flashcards!");
        }
    }

    // Add event listener to the sound checkbox
    document.getElementById("sound-checkbox").addEventListener("change", function () {
        // Call the readText function when the checkbox state changes
        readText();
    });

    // Add event listener for the Previous button
    document.getElementById("prev-button").addEventListener("click", function () {
        if (currentFlashcardIndex > 0) {
            currentFlashcardIndex--;
            applyFiltersAndShowQuestion();
        }
    });

});
