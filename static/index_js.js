let currentRequest = null; // Track the current fetch request
let isGenerating = false; // Track if model is currently generating
let responseStartTime = null; // Track when response generation started
let timerInterval = null; // Track the timer interval

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
		userWrapper.setAttribute("data-message-id", Date.now()); // Add unique ID
		
		const userBubble = document.createElement("div");
		userBubble.className = "message user";
		userBubble.textContent = text;
		
		// Add edit button
		const editButton = document.createElement("button");
		editButton.className = "edit-button";
		editButton.innerHTML = `
			<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;">
				<path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
			</svg>
		`;
		editButton.title = "Edit message";
		editButton.addEventListener("click", () => editMessage(userWrapper, text));
		
		userBubble.appendChild(editButton);
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

	// Typing indicator with live timer
	let loadingWrapper;
	try {
		loadingWrapper = document.createElement("div");
		loadingWrapper.className = "message-wrapper";
		loadingWrapper.id = "loading-indicator";
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
			<div class="live-timer" id="live-timer" style="font-size: 11px; color: #888; margin-top: 8px; display: flex; align-items: center;">
				<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor; margin-right: 4px;">
					<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
				</svg>
				<span id="timer-text">0.0s</span>
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
	responseStartTime = Date.now();
	
	// Start live timer update
	timerInterval = setInterval(() => {
		if (responseStartTime) {
			const elapsed = (Date.now() - responseStartTime) / 1000;
			const timerElement = document.getElementById("timer-text");
			if (timerElement) {
				timerElement.textContent = `${elapsed.toFixed(1)}s`;
			}
		}
	}, 100); // Update every 100ms

	// Perform the API request
	await performAPIRequest(text, chat);

	chat.scrollTop = chat.scrollHeight;
}

// function editMessage(messageWrapper, originalText) {
// 		timeIndicator.innerHTML = `
// 			<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor; margin-right: 4px;">
// 				<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
// 			</svg>
// 			${responseTimeSeconds}s
// 		`;
// 		wrapper.appendChild(timeIndicator);

// 		// Rating section
// 		const ratingSection = document.createElement("div");
// 		ratingSection.className = "rating-section";

// 		const stars = document.createElement("div");
// 		stars.className = "stars";

// 		for (let i = 1; i <= 5; i++) {
// 			const star = document.createElement("span");
// 			star.textContent = "★";
// 			star.addEventListener("click", () => {
// 				[...stars.children].forEach((s, idx) => {
// 					s.classList.toggle("active", idx < i);
// 				});
// 				console.log(`Rated: ${i} stars`);
// 			});
// 			stars.appendChild(star);
// 		}

// 		const feedbackBtn = document.createElement("button");
// 		feedbackBtn.className = "feedback-btn";
// 		feedbackBtn.textContent = "Feedback";
// 		feedbackBtn.addEventListener("click", () => {
// 			const feedback = prompt("Please share your feedback to help improve Helen AI:");
// 			if (feedback) {
// 				console.log("User feedback:", feedback);
// 				alert("Thank you for your feedback! 🙏");
// 			}
// 		});

// 		ratingSection.appendChild(stars);
// 		ratingSection.appendChild(feedbackBtn);
// 		wrapper.appendChild(ratingSection);

// 		chat.appendChild(wrapper);

// 	} catch (error) {
// 		// Safely remove loading indicator
// 		try {
// 			const loadingElement = document.getElementById("loading-indicator");
// 			if (loadingElement && loadingElement.parentNode) {
// 				loadingElement.remove();
// 			}
// 		} catch (removeError) {
// 			console.log("Error removing loading indicator:", removeError);
// 		}

// 		// Stop live timer
// 		if (timerInterval) {
// 			clearInterval(timerInterval);
// 			timerInterval = null;
// 		}

// 		// Handle different types of errors gracefully
// 		if (error.name === 'AbortError') {
// 			// Calculate time until cancellation
// 			const cancelledTime = responseStartTime ? Date.now() - responseStartTime : 0;
// 			const cancelledTimeSeconds = (cancelledTime / 1000).toFixed(1);
			
// 			// Request was cancelled - this is normal, just add a subtle cancelled message
// 			try {
// 				const cancelledWrapper = document.createElement("div");
// 				cancelledWrapper.className = "message-wrapper";
// 				const cancelledBubble = document.createElement("div");
// 				cancelledBubble.className = "message bot cancelled-message";
				
// 				const botIcon = document.createElement("div");
// 				botIcon.className = "bot-icon";
// 				botIcon.innerHTML = `
// 					<svg viewBox="0 0 24 24">
// 						<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H3V9C3 11.76 5.24 14 8 14H16C18.76 14 21 11.76 21 9ZM7 22C5.89 22 5 21.11 5 20V17H7V20C7 20.55 7.45 21 8 21H16C16.55 21 17 20.55 17 20V17H19V20C19 21.11 18.11 22 17 22H7Z"/>
// 					</svg>
// 				`;
				
// 				const messageContent = document.createElement("div");
// 				messageContent.className = "bot-message-content";
// 				messageContent.innerHTML = '<em style="color: #888; font-size: 14px;">Response cancelled</em>';
				
// 				cancelledBubble.appendChild(botIcon);
// 				cancelledBubble.appendChild(messageContent);
// 				cancelledWrapper.appendChild(cancelledBubble);
				
// 				// Add cancelled time indicator
// 				if (cancelledTime > 100) { // Only show if meaningful time passed
// 					const timeIndicator = document.createElement("div");
// 					timeIndicator.className = "response-time cancelled";
// 					timeIndicator.innerHTML = `
// 						<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor; margin-right: 4px;">
// 							<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
// 						</svg>
// 						${cancelledTimeSeconds}s (cancelled)
// 					`;
// 					cancelledWrapper.appendChild(timeIndicator);
// 				}
				
// 				if (chat && chat.appendChild) {
// 					chat.appendChild(cancelledWrapper);
// 				}
// 			} catch (displayError) {
// 				console.log("Error displaying cancelled message:", displayError);
// 			}
// 		} else if (error.name !== 'AbortError') {
// 			// Only show error messages for actual errors, not cancellations
// 			try {
// 				const errorWrapper = document.createElement("div");
// 				errorWrapper.className = "message-wrapper";
// 				const errorBubble = document.createElement("div");
// 				errorBubble.className = "message bot";
				
// 				const botIcon = document.createElement("div");
// 				botIcon.className = "bot-icon";
// 				botIcon.innerHTML = `
// 					<svg viewBox="0 0 24 24">
// 						<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H3V9C3 11.76 5.24 14 8 14H16C18.76 14 21 11.76 21 9ZM7 22C5.89 22 5 21.11 5 20V17H7V20C7 20.55 7.45 21 8 21H16C16.55 21 17 20.55 17 20V17H19V20C19 21.11 18.11 22 17 22H7Z"/>
// 					</svg>
// 				`;
				
// 				const messageContent = document.createElement("div");
// 				messageContent.className = "bot-message-content";
// 				messageContent.textContent = "Sorry, I'm having trouble connecting right now. Please try again.";
				
// 				errorBubble.appendChild(botIcon);
// 				errorBubble.appendChild(messageContent);
// 				errorWrapper.appendChild(errorBubble);
				
// 				if (chat && chat.appendChild) {
// 					chat.appendChild(errorWrapper);
// 				}
// 			} catch (displayError) {
// 				console.log("Error displaying error message:", displayError);
// 			}
// 		}
		
// 		// Log the error for debugging but don't let it crash the app
// 		console.log("Request error (handled gracefully):", error.name, error.message);
		
// 	} finally {
// 		// Always reset the state, even if errors occurred
// 		try {
// 			setSendButtonToSend();
// 			isGenerating = false;
// 			currentRequest = null;
// 			responseStartTime = null;
// 			if (timerInterval) {
// 				clearInterval(timerInterval);
// 				timerInterval = null;
// 			}
// 		} catch (resetError) {
// 			console.log("Error resetting state:", resetError);
// 			// Force reset the critical variables
// 			isGenerating = false;
// 			currentRequest = null;
// 			responseStartTime = null;
// 			if (timerInterval) {
// 				clearInterval(timerInterval);
// 				timerInterval = null;
// 			}
			
// 			// Try to manually reset the button
// 			try {
// 				const sendButton = document.querySelector(".send-button");
// 				if (sendButton) {
// 					sendButton.innerHTML = `
// 						<svg class="send-icon" viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
// 							<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
// 						</svg>
// 					`;
// 					sendButton.style.background = "linear-gradient(135deg, #962455, #AB4F77)";
// 					sendButton.classList.remove("stop-mode");
// 				}
// 			} catch (buttonResetError) {
// 				console.log("Error resetting button:", buttonResetError);
// 			}
// 		}
// 	}

// 	chat.scrollTop = chat.scrollHeight;
// }

function stopGeneration() {
	console.log("Stopping generation...");
	
	// Stop the live timer
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}
	
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
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}
	
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

function editMessage(messageWrapper, originalText) {
	const userBubble = messageWrapper.querySelector(".message.user");
	if (!userBubble) return;
	
	// Create edit interface
	const editContainer = document.createElement("div");
	editContainer.className = "edit-container";
	
	const editTextarea = document.createElement("textarea");
	editTextarea.className = "edit-textarea";
	editTextarea.value = originalText;
	editTextarea.placeholder = "Edit your message...";
	
	// Auto resize the textarea
	editTextarea.style.height = "auto";
	editTextarea.style.height = Math.max(editTextarea.scrollHeight, 40) + "px";
	
	const editButtons = document.createElement("div");
	editButtons.className = "edit-buttons";
	
	const saveButton = document.createElement("button");
	saveButton.className = "edit-save-btn";
	saveButton.innerHTML = `
		<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor; margin-right: 4px;">
			<path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
		</svg>
		Save & Resend
	`;
	
	const cancelButton = document.createElement("button");
	cancelButton.className = "edit-cancel-btn";
	cancelButton.innerHTML = `
		<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor; margin-right: 4px;">
			<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
		</svg>
		Cancel
	`;
	
	editButtons.appendChild(saveButton);
	editButtons.appendChild(cancelButton);
	editContainer.appendChild(editTextarea);
	editContainer.appendChild(editButtons);
	
	// Replace the message content with edit interface
	userBubble.innerHTML = "";
	userBubble.appendChild(editContainer);
	userBubble.classList.add("editing");
	
	// Focus the textarea
	editTextarea.focus();
	editTextarea.setSelectionRange(editTextarea.value.length, editTextarea.value.length);
	
	// Auto resize on input
	editTextarea.addEventListener("input", () => {
		editTextarea.style.height = "auto";
		editTextarea.style.height = Math.max(editTextarea.scrollHeight, 40) + "px";
	});
	
	// Handle save
	saveButton.addEventListener("click", () => {
		const newText = editTextarea.value.trim();
		if (!newText) return;
		
		// Remove all messages after this one
		removeMessagesAfter(messageWrapper);
		
		// Restore the message with new text
		restoreMessage(userBubble, newText);
		
		// Resend the message
		resendMessage(newText);
	});
	
	// Handle cancel
	cancelButton.addEventListener("click", () => {
		restoreMessage(userBubble, originalText);
	});
	
	// Handle Enter key (with Shift+Enter for new line)
	editTextarea.addEventListener("keydown", (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			saveButton.click();
		} else if (e.key === "Escape") {
			cancelButton.click();
		}
	});
}

function restoreMessage(userBubble, text) {
	userBubble.innerHTML = "";
	userBubble.textContent = text;
	userBubble.classList.remove("editing");
	
	// Re-add edit button
	const editButton = document.createElement("button");
	editButton.className = "edit-button";
	editButton.innerHTML = `
		<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;">
			<path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
		</svg>
	`;
	editButton.title = "Edit message";
	editButton.addEventListener("click", () => editMessage(userBubble.parentElement, text));
	
	userBubble.appendChild(editButton);
}

function removeMessagesAfter(messageWrapper) {
	const chat = document.getElementById("chat");
	const allMessages = Array.from(chat.children);
	const messageIndex = allMessages.indexOf(messageWrapper);
	
	// Remove all messages after this one
	for (let i = messageIndex + 1; i < allMessages.length; i++) {
		allMessages[i].remove();
	}
}

function resendMessage(text) {
	// Cancel any ongoing generation first
	if (isGenerating) {
		stopGeneration();
	}
	
	// Wait a bit for cleanup, then send
	setTimeout(() => {
		sendMessageDirectly(text);
	}, 100);
}

function sendMessageDirectly(text) {
	// This is similar to sendMessage but without adding a new user message
	const chat = document.getElementById("chat");
	if (!chat) {
		console.log("Chat element not found");
		return;
	}

	// Change send button to stop button
	setSendButtonToStop();

	// Typing indicator with live timer
	let loadingWrapper;
	try {
		loadingWrapper = document.createElement("div");
		loadingWrapper.className = "message-wrapper";
		loadingWrapper.id = "loading-indicator";
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
			<div class="live-timer" id="live-timer" style="font-size: 11px; color: #888; margin-top: 8px; display: flex; align-items: center;">
				<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor; margin-right: 4px;">
					<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
				</svg>
				<span id="timer-text">0.0s</span>
			</div>
		`;
		
		loading.appendChild(botIcon);
		loading.appendChild(typingContent);
		loadingWrapper.appendChild(loading);
		chat.appendChild(loadingWrapper);
		chat.scrollTop = chat.scrollHeight;
	} catch (error) {
		console.log("Error creating loading indicator:", error);
	}

	// Set generating state and start timer
	isGenerating = true;
	responseStartTime = Date.now();
	
	// Start live timer update
	timerInterval = setInterval(() => {
		if (responseStartTime) {
			const elapsed = (Date.now() - responseStartTime) / 1000;
			const timerElement = document.getElementById("timer-text");
			if (timerElement) {
				timerElement.textContent = `${elapsed.toFixed(1)}s`;
			}
		}
	}, 100);

	// Continue with the same fetch logic as sendMessage
	performAPIRequest(text, chat);
}

async function performAPIRequest(text, chat) {
	try {
		// Create AbortController for cancelling the request
		const abortController = new AbortController();
		currentRequest = abortController;

		const response = await fetch("http://127.0.0.1:5000/ask", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ session_id: null, question: text }),
			signal: abortController.signal
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
		
		// Stop the live timer
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		
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

		// Response time indicator with color coding
		const timeIndicator = document.createElement("div");
		timeIndicator.className = "response-time";
		
		// Add speed-based color coding
		if (responseTime < 2000) {
			timeIndicator.classList.add("fast");
		} else if (responseTime < 5000) {
			timeIndicator.classList.add("medium");
		} else {
			timeIndicator.classList.add("slow");
		}
		
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
		// Handle errors (same as in sendMessage)
		handleAPIError(error, chat);
	} finally {
		// Reset state
		try {
			setSendButtonToSend();
			isGenerating = false;
			currentRequest = null;
			responseStartTime = null;
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		} catch (resetError) {
			console.log("Error resetting state:", resetError);
			// Force reset
			isGenerating = false;
			currentRequest = null;
			responseStartTime = null;
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		}
	}

	chat.scrollTop = chat.scrollHeight;
}

function handleAPIError(error, chat) {
	// Safely remove loading indicator
	try {
		const loadingElement = document.getElementById("loading-indicator");
		if (loadingElement && loadingElement.parentNode) {
			loadingElement.remove();
		}
	} catch (removeError) {
		console.log("Error removing loading indicator:", removeError);
	}

	// Stop live timer
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}

	// Handle different types of errors gracefully
	if (error.name === 'AbortError') {
		// Calculate time until cancellation
		const cancelledTime = responseStartTime ? Date.now() - responseStartTime : 0;
		const cancelledTimeSeconds = (cancelledTime / 1000).toFixed(1);
		
		// Request was cancelled - add cancelled message
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
			
			// Add cancelled time indicator
			if (cancelledTime > 100) {
				const timeIndicator = document.createElement("div");
				timeIndicator.className = "response-time cancelled";
				timeIndicator.innerHTML = `
					<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor; margin-right: 4px;">
						<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
					</svg>
					${cancelledTimeSeconds}s (cancelled)
				`;
				cancelledWrapper.appendChild(timeIndicator);
			}
			
			if (chat && chat.appendChild) {
				chat.appendChild(cancelledWrapper);
			}
		} catch (displayError) {
			console.log("Error displaying cancelled message:", displayError);
		}
	} else if (error.name !== 'AbortError') {
		// Handle other errors
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
		}
	}
	
	console.log("Request error (handled gracefully):", error.name, error.message);
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
	if (timerInterval) {
		clearInterval(timerInterval);
	}
});

// No automatic tips
setTimeout(() => {
	// Tips removed per user request
}, 2000);