document.addEventListener('DOMContentLoaded', function () {
    // Set up the tabs system
    setupTabsSystem();

    // Get DOM elements
    const form = document.getElementById('emotion-form');
    const textInput = document.getElementById('text-input');
    const resultContainer = document.getElementById('result-container');
    const loader = document.getElementById('loader');
    const result = document.getElementById('result');
    const emotionEmoji = document.getElementById('emotion-emoji');
    const emotionText = document.getElementById('emotion-text');
    const confidenceContainer = document.getElementById('confidence-container');
    const analyzedText = document.getElementById('analyzed-text');
    const gameContainer = document.getElementById('game-container');
    const playAgainBtn = document.getElementById('play-again-btn');
    const tabsContainer = document.getElementById('tabs-container');

    // Global variable to store the current emotion
    window.currentEmotion = '';

    // Game global variables
    let gameScore = 0;
    let currentLevel = 1;
    let totalLevels = 5;
    let timeLeft = 30;
    let countdownTimer;
    let bonusPoints = 0;
    let sentenceOptions = [];

    // Listen for form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get the input text
        const text = textInput.value.trim();

        if (!text) {
            alert('Please enter some text to analyze');
            return;
        }

        // Show the tabs container with result tab active
        tabsContainer.style.display = 'block';
        activateTab('result');

        // Show the result container and loader
        resultContainer.style.display = 'flex';
        loader.style.display = 'block';
        result.style.display = 'none';

        // Scroll to the tabs container
        tabsContainer.scrollIntoView({ behavior: 'smooth' });

        // Detect emotion via API
        detectEmotion(text);
    });

    // Function to detect emotion
    function detectEmotion(text) {
        const quoteContainer = document.getElementById('quote-container');
        quoteContainer.style.display = 'block';
        fetch('/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Simulate a minimum loading time for better UX
                setTimeout(() => {
                    displayResult(data);
                }, 1500);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while analyzing the text. Please try again.');
                resultContainer.style.display = 'none';
                tabsContainer.style.display = 'none';
            });
    }

    // Function to display the result
    function displayResult(data) {
        // Hide loader and show result
        loader.style.display = 'none';
        result.style.display = 'block';

        // Store the current emotion for quotes
        window.currentEmotion = data.emotion;

        // Set emotion and emoji
        emotionEmoji.textContent = data.emoji;
        emotionText.textContent = capitalizeFirstLetter(data.emotion);

        // Set analyzed text
        analyzedText.textContent = data.text;

        // Set confidence bars
        confidenceContainer.innerHTML = '';

        // Apply color to the emotion display
        result.style.setProperty('--emotion-color', data.color);

        // Sort the confidence values
        const sortedConfidence = Object.entries(data.confidence)
            .sort((a, b) => b[1] - a[1]);

        // Create confidence bars
        sortedConfidence.forEach(([emotion, value]) => {
            // Create the bar container
            const barContainer = document.createElement('div');
            barContainer.className = 'confidence-bar-container';

            // Create the label
            const label = document.createElement('div');
            label.className = 'confidence-label';
            label.textContent = capitalizeFirstLetter(emotion);

            // Create the bar wrapper
            const barWrapper = document.createElement('div');
            barWrapper.className = 'confidence-bar-wrapper';

            // Create the actual bar
            const bar = document.createElement('div');
            bar.className = 'confidence-bar';
            bar.style.width = '0%';

            // Set the color based on emotion
            bar.style.background = getColorForEmotion(emotion);

            // Create the percentage display
            const percentage = document.createElement('div');
            percentage.className = 'confidence-percentage';
            percentage.textContent = '0%';

            // Assemble the elements
            barWrapper.appendChild(bar);
            barContainer.appendChild(label);
            barContainer.appendChild(barWrapper);
            barContainer.appendChild(percentage);
            confidenceContainer.appendChild(barContainer);

            // Animate the bar after a small delay
            setTimeout(() => {
                bar.style.width = value.toFixed(1) + '%';
                percentage.textContent = value.toFixed(1) + '%';
            }, 100);
        });
    }

    // Function to speak the quote with improved voice settings
    window.speakQuote = function (text) {
        if ('speechSynthesis' in window) {
            // Cancel any previous speech
            window.speechSynthesis.cancel();

            // Break text into manageable chunks (sentences or phrases)
            const chunks = breakTextIntoChunks(text);

            // Get available voices
            let voices = window.speechSynthesis.getVoices();

            // If voices aren't loaded yet, wait for them (happens in some browsers)
            if (voices.length === 0) {
                window.speechSynthesis.addEventListener('voiceschanged', function () {
                    voices = window.speechSynthesis.getVoices();
                    speakChunks(chunks, voices);
                });
            } else {
                speakChunks(chunks, voices);
            }
        } else {
            console.log('Text-to-speech not supported in this browser');
            alert('Sorry, text-to-speech is not supported in your browser.');
        }
    };

    // Helper function to break text into speaking chunks
    function breakTextIntoChunks(text) {
        // Replace any problematic characters that might cause speech to stop
        text = text.replace(/[""]/g, '');

        // First try to split by sentences
        let chunks = text.split(/(?<=[.!?])\s+/);

        // If any chunk is still too long, break it down further
        const maxChunkLength = 100; // Maximum characters per chunk
        let result = [];

        chunks.forEach(chunk => {
            if (chunk.length <= maxChunkLength) {
                result.push(chunk);
            } else {
                // Break down by commas, semicolons, etc.
                const subChunks = chunk.split(/(?<=[,;:])\s+/);

                let currentChunk = '';
                subChunks.forEach(subChunk => {
                    if ((currentChunk + subChunk).length <= maxChunkLength) {
                        currentChunk += (currentChunk ? ' ' : '') + subChunk;
                    } else {
                        if (currentChunk) result.push(currentChunk);
                        currentChunk = subChunk;
                    }
                });

                if (currentChunk) result.push(currentChunk);
            }
        });

        return result;
    }

    // Function to speak chunks sequentially
function speakChunks(chunks, voices) {
    let currentIndex = 0;
    
    // Find a good male English voice for deeper tone
    const maleVoice = voices.find(voice =>
        voice.lang.includes('en-') &&
        (voice.name.includes('Male') || voice.name.includes('Daniel')));
    
    function speakNext() {
        if (currentIndex < chunks.length) {
            const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
            
            // Configure for slow, deep voice
            utterance.rate = 0.8;   // Slower rate
            utterance.pitch = 0.8;  // Lower pitch
            utterance.volume = 1.0; // Full volume
            
            if (maleVoice) {
                utterance.voice = maleVoice;
            }
            
            // Set up event for when this chunk finishes
            utterance.onend = function() {
                currentIndex++;
                speakNext();
            };
            
            // Speak this chunk
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Start speaking
    speakNext();
}


    // Helper function to capitalize the first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Function to get color for an emotion
    function getColorForEmotion(emotion) {
        const colorMap = {
            'joy': '#FFD700',      // Gold
            'sadness': '#1E90FF',  // Blue
            'anger': '#FF4500',    // Red/Orange
            'fear': '#800080',     // Purple
            'love': '#FF69B4',     // Pink
            'surprise': '#00FFFF'  // Cyan
        };

        return colorMap[emotion] || '#CCCCCC';  // Default to gray
    }

    // Enhanced game start function
    window.startEmotionGame = function () {
        // Reset game state
        gameScore = 0;
        currentLevel = 1;
        updateLevelIndicator();
        document.getElementById('current-score').textContent = '0';

        // Show game container, hide result if any
        const gameContainer = document.getElementById('game-container');
        const gameResult = document.getElementById('game-result');
        const finalResults = document.getElementById('final-results');

        gameContainer.style.display = 'block';
        gameResult.style.display = 'none';
        finalResults.style.display = 'none';
        document.getElementById('sentence-options-container').style.display = 'block';

        // Switch to game tab
        activateTab('game');

        // Set the first emotion challenge
        setEmotionChallenge();

        // Reset timer
        timeLeft = 30;
        updateTimerDisplay();
        startCountdown();

        // Scroll to the tabs container
        tabsContainer.scrollIntoView({ behavior: 'smooth' });

        // Update game UI state
        document.getElementById('game-status').style.display = 'block';
        document.getElementById('next-level-btn').style.display = 'none';
    };

    // Set emotion challenge based on current level
    function setEmotionChallenge() {
        const targetEmotion = document.getElementById('target-emotion');
        const targetDescription = document.getElementById('target-description');

        // Different emotions for different levels with increasing difficulty
        const levelChallenges = [
            {
                emotion: 'joy',
                description: 'Select the sentence that best expresses pure happiness',
                options: [
                    { text: "I just got promoted at work and I can't stop smiling!", emotion: 'joy', score: 90 },
                    { text: "The weather is nice today, I might go for a walk later.", emotion: 'neutral', score: 30 },
                    { text: "I won the lottery! This is the best day of my life!", emotion: 'joy', score: 95 },
                    { text: "I'm looking forward to the weekend, it's been a long week.", emotion: 'neutral', score: 45 }
                ]
            },
            {
                emotion: 'sadness',
                description: 'Select the sentence that best expresses deep sorrow',
                options: [
                    { text: "I miss my old friends, we've drifted apart over the years.", emotion: 'sadness', score: 70 },
                    { text: "I failed my exam despite studying for weeks. I feel worthless.", emotion: 'sadness', score: 90 },
                    { text: "The restaurant was closed when I arrived.", emotion: 'neutral', score: 20 },
                    { text: "My beloved pet passed away today after 15 years together.", emotion: 'sadness', score: 95 }
                ]
            },
            {
                emotion: 'anger',
                description: 'Select the sentence that best expresses intense frustration',
                options: [
                    { text: "The customer service was quite disappointing today.", emotion: 'neutral', score: 35 },
                    { text: "I can't believe they lied to my face after everything I did for them!", emotion: 'anger', score: 85 },
                    { text: "This is the third time my order was delivered wrong. I'm furious!", emotion: 'anger', score: 90 },
                    { text: "The traffic was heavier than usual this morning.", emotion: 'neutral', score: 15 }
                ]
            },
            {
                emotion: 'fear',
                description: 'Select the sentence that best expresses anxiety or terror',
                options: [
                    { text: "I'm not sure if I locked the door when I left.", emotion: 'neutral', score: 40 },
                    { text: "My hands are shaking as I wait for the medical test results.", emotion: 'fear', score: 85 },
                    { text: "I heard footsteps behind me in the dark alley and my heart stopped.", emotion: 'fear', score: 95 },
                    { text: "The deadline for this project is approaching quickly.", emotion: 'neutral', score: 50 }
                ]
            },
            {
                emotion: 'surprise',
                description: 'Select the sentence that best expresses astonishment',
                options: [
                    { text: "I never expected to see you here of all places!", emotion: 'surprise', score: 85 },
                    { text: "The magician pulled a rabbit out of his hat.", emotion: 'neutral', score: 40 },
                    { text: "Oh my god! They just announced I won the national competition!", emotion: 'surprise', score: 95 },
                    { text: "The meeting lasted longer than scheduled.", emotion: 'neutral', score: 15 }
                ]
            }
        ];

        // Get challenge for current level (fallback to random if level exceeds array)
        const challenge = currentLevel <= levelChallenges.length
            ? levelChallenges[currentLevel - 1]
            : levelChallenges[Math.floor(Math.random() * levelChallenges.length)];

        targetEmotion.textContent = challenge.emotion;
        targetEmotion.style.color = getColorForEmotion(challenge.emotion);
        targetDescription.textContent = challenge.description;

        // Update difficulty indicator
        document.getElementById('level-difficulty').textContent =
            currentLevel <= 3 ? 'Medium' : 'Hard';

        // Store the current options
        sentenceOptions = challenge.options;

        // Shuffle the options
        shuffleArray(sentenceOptions);

        // Update the option cards
        updateSentenceOptions(sentenceOptions);
    }

    // Shuffle array using Fisher-Yates algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Update sentence option cards
    function updateSentenceOptions(options) {
        const container = document.getElementById('sentence-options');
        container.innerHTML = '';

        options.forEach((option, index) => {
            const card = document.createElement('div');
            card.className = 'sentence-card';
            card.dataset.score = option.score;
            card.dataset.index = index;

            const text = document.createElement('p');
            text.textContent = option.text;

            card.appendChild(text);
            container.appendChild(card);

            // Add click event
            card.addEventListener('click', function () {
                selectSentenceOption(this);
            });
        });
    }

    // Handle sentence selection
    function selectSentenceOption(selectedCard) {
        // Clear any previous selections
        document.querySelectorAll('.sentence-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Mark this card as selected
        selectedCard.classList.add('selected');

        // Enable submit button
        document.getElementById('game-submit-btn').disabled = false;
    }

    // Start countdown timer
    function startCountdown() {
        // Clear any existing timer
        if (countdownTimer) clearInterval(countdownTimer);

        countdownTimer = setInterval(function () {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(countdownTimer);
                // Time's up - auto submit whatever is selected
                submitSentenceSelection();
            }
        }, 1000);
    }

    // Update timer display
    function updateTimerDisplay() {
        const timerElement = document.getElementById('timer-value');
        timerElement.textContent = timeLeft;

        // Change color based on time remaining
        if (timeLeft <= 5) {
            timerElement.style.color = '#F44336'; // Red
        } else if (timeLeft <= 10) {
            timerElement.style.color = '#FF9800'; // Orange
        } else {
            timerElement.style.color = '#4CAF50'; // Green
        }
    }

    // Update level indicator UI
    function updateLevelIndicator() {
        document.getElementById('current-level').textContent = currentLevel;
        document.getElementById('total-levels').textContent = totalLevels;

        // Update progress bar
        const progressPercentage = ((currentLevel - 1) / totalLevels) * 100;
        document.getElementById('level-progress-bar').style.width = progressPercentage + '%';
    }

    // Handle game submission
    window.submitSentenceSelection = function () {
        const selectedCard = document.querySelector('.sentence-card.selected');

        if (!selectedCard) {
            alert('Please select a sentence that best expresses the emotion');
            return;
        }

        // Clear the timer
        clearInterval(countdownTimer);

        // Get score from the selected card
        const score = parseInt(selectedCard.dataset.score);
        const optionIndex = parseInt(selectedCard.dataset.index);
        const selectedOption = sentenceOptions[optionIndex];

        // Calculate bonus points based on time left
        bonusPoints = Math.round(timeLeft * 1.5);
        const totalScore = score + bonusPoints;

        // Add to total game score
        gameScore += totalScore;

        // Hide the options container
        document.getElementById('sentence-options-container').style.display = 'none';

        // Process the result
        processGameSubmission(score, selectedOption);
    };

    // Process game submission and show results with animations
    function processGameSubmission(score, selectedOption) {
        // Update the result display
        const scoreCircle = document.getElementById('score-circle');
        const scoreCircleValue = document.getElementById('score-circle-value');
        const feedback = document.getElementById('game-feedback');
        const levelComplete = document.getElementById('level-complete');
        const bonusDisplay = document.getElementById('time-bonus');
        const totalPoints = document.getElementById('total-points');
        const selectedText = document.getElementById('selected-text');

        // Update score displays
        scoreCircle.textContent = score;
        scoreCircleValue.textContent = score;
        bonusDisplay.textContent = `+${bonusPoints}`;
        totalPoints.textContent = score + bonusPoints;
        document.getElementById('current-score').textContent = gameScore;
        selectedText.textContent = selectedOption.text;

        // Color and feedback based on score
        if (score > 85) {
            scoreCircle.style.backgroundColor = '#4CAF50'; // Green
            feedback.textContent = 'Excellent choice! This perfectly expresses the emotion!';
            levelComplete.textContent = 'Level Complete!';
        } else if (score > 60) {
            scoreCircle.style.backgroundColor = '#FFC107'; // Yellow
            feedback.textContent = 'Good choice! This conveys the emotion well.';
            levelComplete.textContent = 'Level Complete!';
        } else if (score > 40) {
            scoreCircle.style.backgroundColor = '#FF9800'; // Orange
            feedback.textContent = 'Not bad. This somewhat conveys the target emotion.';
            levelComplete.textContent = 'Challenge Met';
        } else {
            scoreCircle.style.backgroundColor = '#F44336'; // Red
            feedback.textContent = "This doesn't strongly express the target emotion.";
            levelComplete.textContent = 'Try Again';
        }

        // Show game result with animated elements
        const gameResult = document.getElementById('game-result');
        gameResult.style.display = 'block';

        // Animate score counting up
        animateValue(scoreCircle, 0, score, 1500);
        animateValue(scoreCircleValue, 0, score, 1500);

        // Show bonus with delay and animation
        setTimeout(() => {
            document.getElementById('bonus-container').style.opacity = '1';
            document.getElementById('bonus-container').style.transform = 'translateY(0)';
            animateValue(document.getElementById('time-bonus'), 0, bonusPoints, 800);
        }, 1500);

        // Show total after both animations complete
        setTimeout(() => {
            document.getElementById('total-container').style.opacity = '1';
            document.getElementById('total-container').style.transform = 'translateY(0)';
            animateValue(document.getElementById('total-points'), 0, score + bonusPoints, 800);
        }, 2300);

        // Check if this was the final level
        if (currentLevel >= totalLevels) {
            setTimeout(() => {
                showFinalResults();
            }, 3000);
        } else {
            // Show next level button
            setTimeout(() => {
                document.getElementById('next-level-btn').style.display = 'inline-block';
            }, 3000);
        }
    }

    // Proceed to next level
    window.nextLevel = function () {
        currentLevel++;
        updateLevelIndicator();

        // Reset the game state for next level
        document.getElementById('game-result').style.display = 'none';
        document.getElementById('bonus-container').style.opacity = '0';
        document.getElementById('bonus-container').style.transform = 'translateY(20px)';
        document.getElementById('total-container').style.opacity = '0';
        document.getElementById('total-container').style.transform = 'translateY(20px)';

        // Show options again
        document.getElementById('sentence-options-container').style.display = 'block';

        // Clear previous selections
        document.querySelectorAll('.sentence-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById('game-submit-btn').disabled = true;

        // Set new emotion challenge
        setEmotionChallenge();

        // Reset timer
        timeLeft = 30;
        updateTimerDisplay();
        startCountdown();
    };

    // Show final results at the end of the game
    function showFinalResults() {
        // Hide game elements
        document.getElementById('game-status').style.display = 'none';
        document.getElementById('sentence-options-container').style.display = 'none';
        document.getElementById('game-result').style.display = 'none';

        // Show final results
        const finalResults = document.getElementById('final-results');
        finalResults.style.display = 'block';

        // Set final score and message
        document.getElementById('final-score').textContent = gameScore;

        let rankText, rankClass;
        if (gameScore >= 450) {
            rankText = 'Emotion Master!';
            rankClass = 'rank-master';
        } else if (gameScore >= 350) {
            rankText = 'Emotion Expert';
            rankClass = 'rank-expert';
        } else if (gameScore >= 250) {
            rankText = 'Emotion Adept';
            rankClass = 'rank-adept';
        } else {
            rankText = 'Emotion Novice';
            rankClass = 'rank-novice';
        }

        const rankElement = document.getElementById('player-rank');
        rankElement.textContent = rankText;
        rankElement.className = 'player-rank ' + rankClass;

        // Confetti effect for high scores
        if (gameScore >= 350) {
            triggerConfetti();
        }
    }

    // Trigger confetti effect
    function triggerConfetti() {
        const confettiContainer = document.getElementById('confetti-container');
        if (!confettiContainer) return;

        const colors = ['#FF5252', '#FFD740', '#2196F3', '#4CAF50', '#9C27B0', '#00BCD4'];

        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
            confetti.style.animationDelay = Math.random() * 5 + 's';

            confettiContainer.appendChild(confetti);
        }

        // Clean up confetti after animation
        setTimeout(() => {
            confettiContainer.innerHTML = '';
        }, 10000);
    }

    // Animate a number counting up
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = end;
            }
        };
        window.requestAnimationFrame(step);
    }

    // Updated showMotivationalQuote function to work with tabs
    window.showMotivationalQuote = function () {
        const quoteContainer = document.getElementById('quote-container');
        const quoteText = quoteContainer.querySelector('.quote-text');
        const quoteAuthor = quoteContainer.querySelector('.quote-author');
        const speakButton = quoteContainer.querySelector('.speak-button');

        // Show loading state
        quoteText.textContent = "Loading an inspirational quote...";
        quoteAuthor.textContent = "";
        quoteContainer.style.display = 'block';

        // Switch to quote tab
        activateTab('quote');

        // Make sure we have the current emotion
        const emotion = window.currentEmotion || 'joy';

        // Fetch a quote from the API based on the current emotion
        fetch(`/quote/${emotion}`)
            .then(response => response.json())
            .then(data => {
                // Update the quote card
                quoteText.textContent = `"${data.quote}"`;
                quoteAuthor.textContent = `— ${data.author}`;

                // Set up the speak button
                speakButton.onclick = function () {
                    window.speakQuote(data.quote);
                };
            })
            .catch(error => {
                console.error('Error fetching quote:', error);
                quoteText.textContent = "Could not load a quote. Please try again.";
            });

        // Scroll to the tabs container
        tabsContainer.scrollIntoView({ behavior: 'smooth' });
    };

    // Play again button
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', function () {
            window.startEmotionGame();
        });
    }
});

// Function to activate a specific tab
function activateTab(tabName) {
    // Remove active class from all buttons and contents
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Add active class to the specified tab button and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Function to set up the tabbed interface
function setupTabsSystem() {
    // First create the tab container to wrap around the result container
    const resultContainer = document.getElementById('result-container');
    const quoteContainer = document.getElementById('quote-container');
    const gameContainer = document.getElementById('game-container');

    // Create the tabs wrapper
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    tabsContainer.id = 'tabs-container';
    tabsContainer.style.display = 'none';

    // Create the tabs header
    const tabsHeader = document.createElement('div');
    tabsHeader.className = 'tabs-header';

    // Create the tab buttons
    const resultButton = document.createElement('button');
    resultButton.className = 'tab-button active';
    resultButton.textContent = 'Results';
    resultButton.dataset.tab = 'result';

    const quoteButton = document.createElement('button');
    quoteButton.className = 'tab-button';
    quoteButton.textContent = 'Inspiration';
    quoteButton.dataset.tab = 'quote';

    const gameButton = document.createElement('button');
    gameButton.className = 'tab-button';
    gameButton.textContent = 'Challenge';
    gameButton.dataset.tab = 'game';

    // Add buttons to header
    tabsHeader.appendChild(resultButton);
    tabsHeader.appendChild(quoteButton);
    tabsHeader.appendChild(gameButton);

    // Insert the tabs container before result container
    resultContainer.parentNode.insertBefore(tabsContainer, resultContainer);

    // Create tab content containers
    const resultContent = document.createElement('div');
    resultContent.className = 'tab-content active';
    resultContent.id = 'result-tab';

    const quoteContent = document.createElement('div');
    quoteContent.className = 'tab-content';
    quoteContent.id = 'quote-tab';

    const gameContent = document.createElement('div');
    gameContent.className = 'tab-content';
    gameContent.id = 'game-tab';

    // Add all to tabs container
    tabsContainer.appendChild(tabsHeader);
    tabsContainer.appendChild(resultContent);
    tabsContainer.appendChild(quoteContent);
    tabsContainer.appendChild(gameContent);

    // Move containers to their respective tab content
    const resultParent = resultContainer.parentNode;
    resultParent.removeChild(resultContainer);
    resultContent.appendChild(resultContainer);

    const quoteParent = quoteContainer.parentNode;
    quoteParent.removeChild(quoteContainer);
    quoteContent.appendChild(quoteContainer);

    const gameParent = gameContainer.parentNode;
    gameParent.removeChild(gameContainer);
    gameContent.appendChild(gameContainer);

    // Fix the display styles (but still keep tabs container hidden initially)
    resultContainer.style.display = 'flex';
    quoteContainer.style.display = 'block';
    gameContainer.style.display = 'block';

    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Activate the tab
            activateTab(this.dataset.tab);
        });
    });
}