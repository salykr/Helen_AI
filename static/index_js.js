async function sendMessage() {
	const input = document.getElementById("user-input");
	const text = input.value.trim();
	if (!text) return;

	const chat = document.getElementById("chat");

	// User message
	const userWrapper = document.createElement("div");
	userWrapper.className = "message-wrapper";
	const userBubble = document.createElement("div");
	userBubble.className = "message user";
	userBubble.textContent = text;
	userWrapper.appendChild(userBubble);
	chat.appendChild(userWrapper);

	input.value = "";
	autoResize(input);

	// Typing indicator
	const loadingWrapper = document.createElement("div");
	loadingWrapper.className = "message-wrapper";
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

	try {
		const response = await fetch("http://127.0.0.1:5000/ask", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ session_id: null, question: text })
		});

		const data = await response.json();
		loadingWrapper.remove();

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
		loadingWrapper.remove();
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
		chat.appendChild(errorWrapper);
	}

	chat.scrollTop = chat.scrollHeight;
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

// No automatic tips
setTimeout(() => {
	// Tips removed per user request
}, 2000);
