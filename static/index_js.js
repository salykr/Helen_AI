let currentRequest = null; // Track the current fetch request
let isGenerating = false; // Track if model is currently generating
let responseStartTime = null; // Track when response generation started

async function sendMessage() {
	// If currently generating, stop the generation
	if (isGenerating) {
		stopGeneration();
		return;
	}

	const input = document.getElementById("user-input");
	if (!input) {
		console.log("Input element not found");
		return;
	}
	
	const text = input.value.trim();
	if (!text) return;

	const chat = document.getElementById("chat");
	if (!chat) {
		console.log("Chat element not found");
		return;
	}

	// User message
	try {
		const userWrapper = document.createElement("div");
		userWrapper.className = "message-wrapper";
		const userBubble = document.createElement("div");
		userBubble.className = "message user";
		userBubble.textContent = text;
		userWrapper.appendChild(userBubble);
		chat.appendChild(userWrapper);

		input.value = "";
		autoResize(input);
	} catch (error) {
		console.log("Error creating user message:", error);
		// Continue anyway
	}

	// Change send button to stop button
	setSendButtonToStop();

	// Typing indicator
	let loadingWrapper;
	try {
		loadingWrapper = document.createElement("div");
		loadingWrapper.className = "message-wrapper";
		loadingWrapper.id = "loading-indicator"; // Add ID for easy removal
		const loading = document.createElement("div");
		loading.className = "message bot typing-indicator";
		
		const botIcon = document.createElement("div");
		botIcon.className = "bot-icon";
		botIcon.innerHTML = `
			<svg viewBox="0 0 24 24">
				<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H3V9C3 11.76 5.24 14 8 14H16C18.76 14 21 11.76 21 9ZM7 22C5.89 22 5 21.11 5 20V17H7V20C7 20.55 7.45 21 8 21H16C16.55 21 17 20.55 17 20V17H19V20C19 21.11 18.11 22 17 22H7Z"/>
			</svg>
		`;
		
		const typingContent = document.createElement("div");
		typingContent.className = "bot-message-content";
		typingContent.innerHTML = `
			<div class="typing-dots">
				<span></span>
				<span></span>
				<span></span>
			</div>
		`;
		
		loading.appendChild(botIcon);
		loading.appendChild(typingContent);
		loadingWrapper.appendChild(loading);
		chat.appendChild(loadingWrapper);
		chat.scrollTop = chat.scrollHeight;
	} catch (error) {
		console.log("Error creating loading indicator:", error);
		// Continue anyway
	}

	// Set generating state and start timer
	isGenerating = true;
	responseStartTime = Date.now(); // Start timing the response

	try {
		// Create AbortController for cancelling the request
		const abortController = new AbortController();
		currentRequest = abortController;

		const response = await fetch("http://127.0.0.1:5000/ask", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ session_id: null, question: text }),
			signal: abortController.signal // Add abort signal
		});

		// Check if request was aborted
		if (abortController.signal.aborted) {
			console.log("Request was cancelled");
			return;
		}

		const data = await response.json();
		
		// Calculate response time
		const responseTime = responseStartTime ? Date.now() - responseStartTime : 0;
		const responseTimeSeconds = (responseTime / 1000).toFixed(1);
		
		// Remove loading indicator
		const loadingElement = document.getElementById("loading-indicator");
		if (loadingElement) {
			loadingElement.remove();
		}

		// Bot response with rating
		const wrapper = document.createElement("div");
		wrapper.className = "message-wrapper";

		const botBubble = document.createElement("div");
		botBubble.className = "message bot";
		
		const botIcon = document.createElement("div");
		botIcon.className = "bot-icon";
		botIcon.innerHTML = `
			<svg viewBox="0 0 24 24">
				<path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
			</svg>
		`;
		
		const messageContent = document.createElement("div");
		messageContent.className = "bot-message-content";
		messageContent.textContent = data.response;
		
		botBubble.appendChild(botIcon);
		botBubble.appendChild(messageContent);
		wrapper.appendChild(botBubble);

		// Response time indicator
		const timeIndicator = document.createElement("div");
		timeIndicator.className = "response-time";
		timeIndicator.innerHTML = `
			<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor; margin-right: 4px;">
				<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
			</svg>
			${responseTimeSeconds}s
		`;
		wrapper.appendChild(timeIndicator);

		// Rating section
		const ratingSection = document.createElement("div");
		ratingSection.className = "rating-section";

		const stars = document.createElement("div");
		stars.className = "stars";

		for (let i = 1; i <= 5; i++) {
			const star = document.createElement("span");
			star.textContent = "★";
			star.addEventListener("click", () => {
				[...stars.children].forEach((s, idx) => {
					s.classList.toggle("active", idx < i);
				});
				console.log(`Rated: ${i} stars`);
			});
			stars.appendChild(star);
		}

		const feedbackBtn = document.createElement("button");
		feedbackBtn.className = "feedback-btn";
		feedbackBtn.textContent = "Feedback";
		feedbackBtn.addEventListener("click", () => {
			const feedback = prompt("Please share your feedback to help improve Helen AI:");
			if (feedback) {
				console.log("User feedback:", feedback);
				alert("Thank you for your feedback! 🙏");
			}
		});

		ratingSection.appendChild(stars);
		ratingSection.appendChild(feedbackBtn);
		wrapper.appendChild(ratingSection);

		chat.appendChild(wrapper);

	} catch (error) {
		// Safely remove loading indicator
		try {
			const loadingElement = document.getElementById("loading-indicator");
			if (loadingElement && loadingElement.parentNode) {
				loadingElement.remove();
			}
		} catch (removeError) {
			console.log("Error removing loading indicator:", removeError);
		}

		// Handle different types of errors gracefully
		if (error.name === 'AbortError') {
			// Request was cancelled - this is normal, just add a subtle cancelled message
			try {
				const cancelledWrapper = document.createElement("div");
				cancelledWrapper.className = "message-wrapper";
				const cancelledBubble = document.createElement("div");
				cancelledBubble.className = "message bot cancelled-message";
				
				const botIcon = document.createElement("div");
				botIcon.className = "bot-icon";
				botIcon.innerHTML = `
					<svg viewBox="0 0 24 24">
						<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H3V9C3 11.76 5.24 14 8 14H16C18.76 14 21 11.76 21 9ZM7 22C5.89 22 5 21.11 5 20V17H7V20C7 20.55 7.45 21 8 21H16C16.55 21 17 20.55 17 20V17H19V20C19 21.11 18.11 22 17 22H7Z"/>
					</svg>
				`;
				
				const messageContent = document.createElement("div");
				messageContent.className = "bot-message-content";
				messageContent.innerHTML = '<em style="color: #888; font-size: 14px;">Response cancelled</em>';
				
				cancelledBubble.appendChild(botIcon);
				cancelledBubble.appendChild(messageContent);
				cancelledWrapper.appendChild(cancelledBubble);
				
				if (chat && chat.appendChild) {
					chat.appendChild(cancelledWrapper);
				}
			} catch (displayError) {
				console.log("Error displaying cancelled message:", displayError);
				// Continue without showing the message - this is not critical
			}
		} else if (error.name !== 'AbortError') {
			// Only show error messages for actual errors, not cancellations
			try {
				const errorWrapper = document.createElement("div");
				errorWrapper.className = "message-wrapper";
				const errorBubble = document.createElement("div");
				errorBubble.className = "message bot";
				
				const botIcon = document.createElement("div");
				botIcon.className = "bot-icon";
				botIcon.innerHTML = `
					<svg viewBox="0 0 24 24">
						<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H3V9C3 11.76 5.24 14 8 14H16C18.76 14 21 11.76 21 9ZM7 22C5.89 22 5 21.11 5 20V17H7V20C7 20.55 7.45 21 8 21H16C16.55 21 17 20.55 17 20V17H19V20C19 21.11 18.11 22 17 22H7Z"/>
					</svg>
				`;
				
				const messageContent = document.createElement("div");
				messageContent.className = "bot-message-content";
				messageContent.textContent = "Sorry, I'm having trouble connecting right now. Please try again.";
				
				errorBubble.appendChild(botIcon);
				errorBubble.appendChild(messageContent);
				errorWrapper.appendChild(errorBubble);
				
				if (chat && chat.appendChild) {
					chat.appendChild(errorWrapper);
				}
			} catch (displayError) {
				console.log("Error displaying error message:", displayError);
				// Continue without showing the message
			}
		}
		
		// Log the error for debugging but don't let it crash the app
		console.log("Request error (handled gracefully):", error.name, error.message);
		
	} finally {
		// Always reset the state, even if errors occurred
		try {
			setSendButtonToSend();
			isGenerating = false;
			currentRequest = null;
			responseStartTime = null; // Reset timer
		} catch (resetError) {
			console.log("Error resetting state:", resetError);
			// Force reset the critical variables
			isGenerating = false;
			currentRequest = null;
			responseStartTime = null;
			
			// Try to manually reset the button
			try {
				const sendButton = document.querySelector(".send-button");
				if (sendButton) {
					sendButton.innerHTML = `
						<svg class="send-icon" viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
							<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
						</svg>
					`;
					sendButton.style.background = "linear-gradient(135deg, #962455, #AB4F77)";
					sendButton.classList.remove("stop-mode");
				}
			} catch (buttonResetError) {
				console.log("Error resetting button:", buttonResetError);
			}
		}
	}

	chat.scrollTop = chat.scrollHeight;
}

function stopGeneration() {
	console.log("Stopping generation...");
	
	// Calculate partial response time if available
	const partialTime = responseStartTime ? Date.now() - responseStartTime : 0;
	const partialTimeSeconds = (partialTime / 1000).toFixed(1);
	
	// Cancel the request safely
	try {
		if (currentRequest) {
			currentRequest.abort();
			console.log("Request aborted successfully");
		}
	} catch (abortError) {
		console.log("Error aborting request (continuing anyway):", abortError);
	}
	
	// Clean up the current request reference and reset timer
	currentRequest = null;
	responseStartTime = null;
	
	// Remove loading indicator safely
	try {
		const loadingElement = document.getElementById("loading-indicator");
		if (loadingElement && loadingElement.parentNode) {
			loadingElement.remove();
			console.log("Loading indicator removed");
		}
	} catch (removeError) {
		console.log("Error removing loading indicator (continuing anyway):", removeError);
	}
	
	// Reset button and state safely
	try {
		setSendButtonToSend();
		isGenerating = false;
		console.log("State reset successfully");
	} catch (resetError) {
		console.log("Error resetting state (forcing reset):", resetError);
		
		// Force reset critical variables
		isGenerating = false;
		
		// Manually reset button if setSendButtonToSend fails
		try {
			const sendButton = document.querySelector(".send-button");
			if (sendButton) {
				sendButton.innerHTML = `
					<svg class="send-icon" viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
						<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
					</svg>
				`;
				sendButton.style.background = "linear-gradient(135deg, #962455, #AB4F77)";
				sendButton.classList.remove("stop-mode");
				sendButton.title = "Send message";
			}
		} catch (buttonError) {
			console.log("Error manually resetting button:", buttonError);
		}
	}
	
	console.log("Stop generation completed");
}

function setSendButtonToStop() {
	try {
		const sendButton = document.querySelector(".send-button");
		if (!sendButton) {
			console.log("Send button not found");
			return;
		}
		
		sendButton.innerHTML = `
			<svg class="stop-icon" viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
				<path d="M6 6h12v12H6z"/>
			</svg>
		`;
		sendButton.style.background = "linear-gradient(135deg, #dc2626, #ef4444)";
		sendButton.title = "Stop generation";
		sendButton.classList.add("stop-mode");
		
		console.log("Button set to stop mode");
	} catch (error) {
		console.log("Error setting button to stop mode:", error);
	}
}

function setSendButtonToSend() {
	try {
		const sendButton = document.querySelector(".send-button");
		if (!sendButton) {
			console.log("Send button not found");
			return;
		}
		
		sendButton.innerHTML = `
			<svg class="send-icon" viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
				<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
			</svg>
		`;
		sendButton.style.background = "linear-gradient(135deg, #962455, #AB4F77)";
		sendButton.title = "Send message";
		sendButton.classList.remove("stop-mode");
		
		console.log("Button set to send mode");
	} catch (error) {
		console.log("Error setting button to send mode:", error);
	}
}

function autoResize(textarea) {
	textarea.style.height = 'auto';
	textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
}

document.getElementById("user-input").addEventListener("keydown", function (e) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
});

// Handle page unload to cancel any ongoing requests
window.addEventListener('beforeunload', () => {
	if (currentRequest) {
		currentRequest.abort();
	}
});

// No automatic tips
setTimeout(() => {
	// Tips removed per user request
}, 2000);
