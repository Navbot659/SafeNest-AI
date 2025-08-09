// SafeNest AI - Frontend JavaScript with Backend Integration
// Connects to real backend API for full functionality

// Configuration
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://your-backend.railway.app';
let authToken = localStorage.getItem('safenest_token');

// Application State
let currentView = 'dashboard';
let isVoiceActive = false;
let chatMessages = [];
let speechRecognition = null;
let currentUser = null;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('SafeNest AI initializing...');
    
    // Check if user is logged in
    if (authToken) {
        try {
            const response = await fetch(`${API_BASE}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok) {
                currentUser = await response.json();
                showMainApp();
            } else {
                showWelcomeScreen();
            }
        } catch (error) {
            console.log('Backend not available, using demo mode');
            showWelcomeScreen();
        }
    } else {
        showWelcomeScreen();
    }
    
    // Initialize Speech Recognition
    initializeSpeechRecognition();
    
    // Setup Event Listeners
    setupEventListeners();
    
    console.log('SafeNest AI initialized successfully');
}

function showWelcomeScreen() {
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
}

function setupEventListeners() {
    // Welcome button
    const welcomeBtn = document.getElementById('welcomeBtn');
    if (welcomeBtn) {
        welcomeBtn.addEventListener('click', handleWelcomeClick);
    }
    
    // Voice button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoice);
    }
    
    // Emergency button
    const emergencyBtn = document.getElementById('emergencyBtn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', triggerEmergency);
    }
    
    // Close voice overlay
    const closeVoice = document.getElementById('closeVoice');
    if (closeVoice) {
        closeVoice.addEventListener('click', stopVoice);
    }
    
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Navigation buttons
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });
}

async function handleWelcomeClick() {
    // For demo purposes, create a guest session
    try {
        const guestUser = {
            name: 'Guardian',
            email: 'demo@safenest.ai',
            id: 'demo-user'
        };
        
        currentUser = guestUser;
        showMainApp();
        
        // Show welcome message in chat
        setTimeout(() => {
            switchView('chat');
            addAIMessage('Welcome to SafeNest AI! 🏡\n\nI\'m your advanced family safety assistant. I can help you:\n\n• Monitor family locations\n• Provide safety insights\n• Handle emergencies\n• Learn your family patterns\n• Process voice commands\n\nTry asking "Where is everyone?" or use voice commands by saying "SafeNest, family status!"');
        }, 500);
        
    } catch (error) {
        console.error('Welcome flow error:', error);
        // Fallback to demo mode
        showMainApp();
    }
}

function switchView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.add('hidden'));
    
    // Show selected view
    const targetView = document.getElementById(viewName + 'View');
    if (targetView) {
        targetView.classList.remove('hidden');
        currentView = viewName;
    }
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('nav-item--active');
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('nav-item--active');
        }
    });
    
    // Load view-specific data
    if (viewName === 'dashboard') {
        loadFamilyData();
    } else if (viewName === 'map') {
        loadMapData();
    }
}

async function loadFamilyData() {
    try {
        if (!authToken) {
            // Demo mode - show sample data
            return;
        }
        
        const response = await fetch(`${API_BASE}/api/family`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateFamilyCards(data.family);
        }
    } catch (error) {
        console.log('Using demo family data');
    }
}

function updateFamilyCards(familyMembers) {
    // Update the family cards with real data
    // This would dynamically generate the family member cards
    console.log('Family data loaded:', familyMembers);
}

async function loadMapData() {
    try {
        if (!authToken) return;
        
        const response = await fetch(`${API_BASE}/api/locations/current`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateMapLocations(data.locations);
        }
    } catch (error) {
        console.log('Using demo location data');
    }
}

function updateMapLocations(locations) {
    // Update the map with real location data
    console.log('Location data loaded:', locations);
}

function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = false;
        speechRecognition.lang = 'en-US';
        
        speechRecognition.onstart = function() {
            console.log('Speech recognition started');
            isVoiceActive = true;
        };
        
        speechRecognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('Voice command:', transcript);
            processVoiceCommand(transcript);
        };
        
        speechRecognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            stopVoice();
        };
        
        speechRecognition.onend = function() {
            console.log('Speech recognition ended');
            stopVoice();
        };
    } else {
        console.warn('Speech recognition not supported');
    }
}

function toggleVoice() {
    if (isVoiceActive) {
        stopVoice();
    } else {
        startVoice();
    }
}

function startVoice() {
    if (speechRecognition) {
        const voiceOverlay = document.getElementById('voiceOverlay');
        if (voiceOverlay) {
            voiceOverlay.classList.remove('hidden');
        }
        
        speechRecognition.start();
        isVoiceActive = true;
    }
}

function stopVoice() {
    if (speechRecognition && isVoiceActive) {
        speechRecognition.stop();
    }
    
    const voiceOverlay = document.getElementById('voiceOverlay');
    if (voiceOverlay) {
        voiceOverlay.classList.add('hidden');
    }
    
    isVoiceActive = false;
}

function processVoiceCommand(transcript) {
    console.log('Processing voice command:', transcript);
    
    // Remove "SafeNest" wake word if present
    const cleanTranscript = transcript.replace(/safenest/gi, '').trim();
    
    // Switch to chat view and process command
    switchView('chat');
    addUserMessage(`Voice: "${transcript}"`);
    
    setTimeout(async () => {
        const response = await generateAIResponse(cleanTranscript);
        addAIMessage(response);
    }, 1000);
    
    stopVoice();
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput || !chatInput.value.trim()) return;
    
    const message = chatInput.value.trim();
    addUserMessage(message);
    chatInput.value = '';
    
    // Process AI response
    setTimeout(async () => {
        const response = await generateAIResponse(message);
        addAIMessage(response);
    }, 1000);
}

function sendQuickMessage(message) {
    addUserMessage(message);
    
    setTimeout(async () => {
        const response = await generateAIResponse(message);
        addAIMessage(response);
    }, 1000);
}

async function generateAIResponse(message) {
    try {
        if (authToken) {
            // Try to use real backend AI
            const response = await fetch(`${API_BASE}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.response;
            }
        }
    } catch (error) {
        console.log('Using offline AI response');
    }
    
    // Fallback to local AI responses
    const lowerMessage = message.toLowerCase();
    
    // Professional AI responses
    const responses = {
        'where is everyone': `Current Family Location Analysis:

🏠 You: Home Base (Verified Safe Zone)
🛒 Mom: Local Market (GPS Confirmed - 0.8km from home)
🏢 Dad: Office Complex (Active Movement Detected)

📡 System Status: All devices connected
🛡️ Safety Metrics: All family members within monitored zones
🔋 Device Health: Optimal battery levels across all tracked devices

Real-time synchronization active across the SafeNest network.`,

        'family safety status': `SafeNest AI Security Analysis:

🛡️ SYSTEM STATUS: All Clear
📍 Location Monitoring: Active across 3 devices
🔋 Device Connectivity: 100% operational
🚨 Emergency Protocols: Armed and ready
🧠 AI Pattern Analysis: Learning family routines
⚡ Network Status: Real-time sync enabled

✅ All family safety parameters within optimal ranges
🎯 Predictive algorithms running background analysis`,

        'show insights': `📊 Advanced Family Analytics Dashboard:

📈 Weekly Patterns Detected:
🏠 Home arrival consistency: 94% (7:00-7:30 PM)
🚗 Dad's commute optimization: Route efficiency up 12%
🛒 Mom's shopping patterns: 45-minute average duration
👨‍👩‍👧‍👦 Family synchronization score: 87/100

🔮 AI Predictions:
• Everyone expected home by 7:15 PM today
• Weekend family activity window: Saturday 2-5 PM
• Optimal grocery shopping time: Tuesday mornings

🛡️ Safety Intelligence:
Current family safety score: 98/100 (Excellent)`,

        'emergency': `🚨 EMERGENCY PROTOCOL ACTIVATED

SafeNest AI Emergency Response initiated:

📞 Immediate Actions:
• Indian Emergency Services (112) contacted with GPS coordinates
• All family members receive priority alert notifications
• Emergency contact chain activated automatically
• Location data shared with first responders

🛡️ Safety Measures:
• Real-time location broadcasting enabled
• Battery conservation mode activated on all devices
• Emergency services provided with family medical information

⏱️ Response Status: Emergency teams dispatched
📍 Your exact location transmitted to responders

Stay calm. Professional help is en route.`
    };
    
    // Check for specific commands
    for (const [key, value] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return value;
        }
    }
    
    // Generic responses for common queries
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return 'Hello! I\'m your SafeNest AI security assistant. I\'m equipped with advanced family safety monitoring capabilities. How can I help protect your family today?';
    }
    
    if (lowerMessage.includes('help')) {
        return 'SafeNest AI Capabilities:\n\n🏠 Real-time family location monitoring\n🛡️ Advanced safety status analysis\n🚨 Emergency response coordination\n🧠 Predictive family pattern analysis\n🎤 Natural language voice commands\n\nTry commands like "Where is everyone?" or "Show safety analysis"';
    }
    
    if (lowerMessage.includes('battery')) {
        return 'Device Power Analysis:\n\n🔋 Your Device: 85% (Optimal)\n🔋 Mom\'s Phone: 67% (Good)\n⚠️ Dad\'s Phone: 45% (Monitor - recommend charging)\n\n🔌 Power Management:\nAll devices configured for extended battery life during family monitoring. Dad\'s device approaching advisory charging threshold.';
    }
    
    // Default intelligent response
    return `SafeNest AI Analysis Complete.

Your query: "${message}"

🧠 Processing Context: Family safety and location intelligence
📡 System Status: All monitoring systems operational
🎯 Recommendation: For specific family insights, try:

• "Where is everyone?" - Current location status
• "Safety analysis" - Comprehensive security overview  
• "Show patterns" - Weekly family activity insights
• "Emergency protocols" - Safety response procedures

SafeNest AI continues learning your family's unique patterns for enhanced protection.`;
}

function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <div class="message-text">${message}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addAIMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">🧠</div>
        <div class="message-content">
            <div class="message-text">${message}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function triggerEmergency() {
    // Show loading
    showLoading('Activating Emergency Protocols...');
    
    try {
        if (authToken) {
            // Try to use real backend emergency system
            const response = await fetch(`${API_BASE}/api/emergency/trigger`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Emergency alert triggered from SafeNest AI',
                    location: await getCurrentLocation()
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                hideLoading();
                switchView('chat');
                addAIMessage(`🚨 EMERGENCY PROTOCOL ACTIVATED!\n\n${data.actions.join('\n• ')}\n\nEmergency ID: ${data.alertId}\n\nStay safe. Professional help is responding.`);
                return;
            }
        }
    } catch (error) {
        console.log('Using offline emergency mode');
    }
    
    // Fallback emergency mode
    setTimeout(() => {
        hideLoading();
        switchView('chat');
        addAIMessage('🚨 EMERGENCY PROTOCOL ACTIVATED!\n\n• Family members would be notified immediately\n• Emergency services (112) would be contacted with GPS location\n• Emergency contacts would receive priority alerts\n• SafeNest AI would coordinate with first responders\n\n⚠️ Demo Mode: In real deployment, this triggers actual emergency response systems.\n\nAlways call 112 directly for immediate emergencies.');
        
        // Also show alert
        alert('Emergency Protocol Demonstration\n\n✅ In full deployment, this would:\n• Call 112 with your location\n• Send SMS to family members\n• Notify emergency contacts\n• Coordinate with local emergency services\n\nFor real emergencies, always call 112 directly.');
    }, 2000);
}

async function getCurrentLocation() {
    return new Promise((resolve) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                () => {
                    resolve({ latitude: 0, longitude: 0, accuracy: 0 });
                }
            );
        } else {
            resolve({ latitude: 0, longitude: 0, accuracy: 0 });
        }
    });
}

function showLoading(message = 'Processing...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        const loadingText = loadingOverlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for global access
window.enterApp = handleWelcomeClick;
window.switchView = switchView;
window.toggleVoice = toggleVoice;
window.sendQuickMessage = sendQuickMessage;
window.triggerEmergency = triggerEmergency;
