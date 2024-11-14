// Get references to HTML elements
const menuIcon = document.getElementById('menuIcon');
const sidebar = document.getElementById('sidebar');
const toggleDarkModeButton = document.getElementById('toggleDarkMode');
const openChatInNewTabButton = document.getElementById('openChatInNewTab');
const refreshPageButton = document.getElementById('refreshPage');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const voiceButton = document.querySelector('.voice-button');
const voiceButtonImage = voiceButton.querySelector('img');
const readAloudButton = document.getElementById('readAloudButton'); // New button for reading aloud
let isDarkMode = true;
let isReading = false; // Flag to track reading state

// Toggle sidebar visibility
menuIcon.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    document.querySelector('.chat-box').style.left = sidebar.classList.contains('active') ? '60px' : '20%';
});

// Toggle between dark and light mode
toggleDarkModeButton.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    toggleDarkModeButton.textContent = isDarkMode ? 'Dark Mode' : 'Light Mode';
    isDarkMode = !isDarkMode;
});

// Open chat in a new tab and save chat history
openChatInNewTabButton.addEventListener('click', () => {
    const chatHistory = chatMessages.innerHTML;
    localStorage.setItem('chatHistory', chatHistory);
    window.open('index.html', '_blank');
});

// Refresh the page
refreshPageButton.addEventListener('click', () => {
    location.reload();
});

// Function to create clickable links
function linkify(text) {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const emailPattern = /(([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+))/ig;
    return text
        .replace(urlPattern, '<a href="$1" target="_blank">$1</a>')
        .replace(emailPattern, '<a href="mailto:$1">$1</a>');
}

// Send message to the bot
const sendMessage = async () => {
    let userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // Remove special characters from user message
    userMessage = userMessage.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    // Display user message in chat
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'user-message';
    userMessageElement.textContent = userMessage;
    chatMessages.appendChild(userMessageElement);
    chatInput.value = '';

    // Send user message to server and get response
    const response = await fetch('http://192.168.0.105:8000', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: userMessage })
    });
    const result = await response.json();

    // Display bot response in chat
    const botMessageElement = document.createElement('div');
    botMessageElement.className = 'bot-message';
    botMessageElement.innerHTML = linkify(result.answer); // Convert URLs to clickable links
    chatMessages.appendChild(botMessageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
};

// Attach event listeners for sending messages
document.querySelector('.send-button').addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') sendMessage();
});

// Open menu links in a new tab
document.querySelectorAll('.menu li').forEach(item => {
    item.addEventListener('click', () => {
        const link = item.getAttribute('data-link');
        if (link) {
            window.open(link, '_blank'); // Open link in a new tab
        }
    });
});

// Load chat history if it exists
window.onload = () => {
    const chatHistory = localStorage.getItem('chatHistory');
    if (chatHistory) {
        chatMessages.innerHTML = chatHistory;
        localStorage.removeItem('chatHistory');
    }
};

// Voice recognition setup
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // Start listening
    recognition.onstart = () => {
        voiceButtonImage.src = 'listening.png'; // Change to a different image when listening
    };

    // Process result
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // Remove special characters
        sendMessage();
    };

    // Handle errors
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
    };

    // End listening
    recognition.onend = () => {
        voiceButtonImage.src = 'mic.png'; // Change back to original image
    };

    // Start voice recognition when the button is clicked
    voiceButton.addEventListener('click', () => {
        recognition.start();
    });
} else {
    voiceButton.style.display = 'none';
    console.warn('Speech recognition not supported in this browser.');
}

// Read Aloud functionality
readAloudButton.addEventListener('click', () => {
    if (isReading) {
        speechSynthesis.cancel(); // Stop reading
        readAloudButton.textContent = 'Read Aloud';
        isReading = false;
    } else {
        const latestBotMessage = chatMessages.querySelector('.bot-message:last-child');
        if (latestBotMessage) {
            const textContent = latestBotMessage.innerText;
            const utterance = new SpeechSynthesisUtterance(textContent);
            utterance.onend = () => {
                isReading = false;
                readAloudButton.textContent = 'Read Aloud';
            };
            speechSynthesis.speak(utterance);
            readAloudButton.textContent = 'Stop Reading';
            isReading = true;
        }
    }
});