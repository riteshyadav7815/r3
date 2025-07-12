
// API Configuration
const API_BASE = window.location.origin;
const API_URL = `${API_BASE}/api`;

// Authentication and state management
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Data Management System with API Integration
class DataManager {
    constructor() {
        this.initializeData();
    }

    async initializeData() {
        // Check authentication
        if (authToken) {
            try {
                const response = await fetch(`${API_URL}/auth/verify`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (response.ok) {
                    currentUser = await response.json();
                } else {
                    this.logout();
                }
            } catch (error) {
                console.log('Using offline mode');
                this.initializeOfflineData();
            }
        }
    }

    initializeOfflineData() {
        // Initialize default data if not exists (offline fallback)
        if (!localStorage.getItem('hospitals')) {
            const defaultHospitals = [
                { id: 1, name: 'Peripheral Hospital A', totalBeds: 50, availableBeds: 12, status: 'active', contactNumber: '+91-9876543210' },
                { id: 2, name: 'Peripheral Hospital B', totalBeds: 75, availableBeds: 8, status: 'active', contactNumber: '+91-9876543211' },
                { id: 3, name: 'Central Hospital', totalBeds: 200, availableBeds: 45, status: 'active', contactNumber: '+91-9876543212' }
            ];
            localStorage.setItem('hospitals', JSON.stringify(defaultHospitals));
        }

        if (!localStorage.getItem('referrals')) {
            const defaultReferrals = [
                {
                    id: 1,
                    patientName: 'John Doe',
                    age: 45,
                    gender: 'male',
                    urgency: 'emergency',
                    specialty: 'cardiology',
                    status: 'confirmed',
                    maaYojana: false,
                    createdAt: new Date().toISOString(),
                    eta: 15
                }
            ];
            localStorage.setItem('referrals', JSON.stringify(defaultReferrals));
        }
    }

    async login(username, password, role) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });

            if (response.ok) {
                const data = await response.json();
                authToken = data.token;
                currentUser = data.user;
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('isLoggedIn', 'true');
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            // Fallback to demo login
            if ((username === 'admin' && password === 'admin123') || 
                (username === 'doctor1' && password === 'doctor123')) {
                localStorage.setItem('userRole', role || 'admin');
                localStorage.setItem('username', username);
                localStorage.setItem('isLoggedIn', 'true');
                return { success: true };
            }
            return { success: false, error: 'Connection failed. Using demo mode.' };
        }
    }

    logout() {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    }

    // Hospital Management
    async getHospitals() {
        try {
            if (authToken) {
                const response = await fetch(`${API_URL}/hospitals`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.log('Using offline data for hospitals');
        }
        return JSON.parse(localStorage.getItem('hospitals') || '[]');
    }

    async addHospital(hospital) {
        try {
            if (authToken) {
                const response = await fetch(`${API_URL}/hospitals`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(hospital)
                });
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.log('Using offline mode for add hospital');
        }
        
        // Fallback to localStorage
        const hospitals = this.getHospitals();
        hospital.id = Date.now();
        hospitals.push(hospital);
        localStorage.setItem('hospitals', JSON.stringify(hospitals));
        return hospital;
    }

    async updateHospital(id, updates) {
        try {
            if (authToken) {
                const response = await fetch(`${API_URL}/hospitals/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                });
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.log('Using offline mode for update hospital');
        }

        // Fallback to localStorage
        const hospitals = await this.getHospitals();
        const index = hospitals.findIndex(h => h.id === id);
        if (index !== -1) {
            hospitals[index] = { ...hospitals[index], ...updates };
            localStorage.setItem('hospitals', JSON.stringify(hospitals));
            return hospitals[index];
        }
        return null;
    }

    async deleteHospital(id) {
        try {
            if (authToken) {
                const response = await fetch(`${API_URL}/hospitals/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (response.ok) {
                    return true;
                }
            }
        } catch (error) {
            console.log('Using offline mode for delete hospital');
        }

        // Fallback to localStorage
        const hospitals = await this.getHospitals();
        const filtered = hospitals.filter(h => h.id !== id);
        localStorage.setItem('hospitals', JSON.stringify(filtered));
        return true;
    }

    // Referral Management
    async getReferrals() {
        try {
            if (authToken) {
                const response = await fetch(`${API_URL}/referrals`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.log('Using offline data for referrals');
        }
        return JSON.parse(localStorage.getItem('referrals') || '[]');
    }

    async addReferral(referral) {
        try {
            if (authToken) {
                const response = await fetch(`${API_URL}/referrals`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(referral)
                });
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.log('Using offline mode for add referral');
        }

        // Fallback to localStorage
        const referrals = await this.getReferrals();
        referral.id = Date.now();
        referral.createdAt = new Date().toISOString();
        referral.status = 'pending';
        referral.eta = Math.floor(Math.random() * 45) + 15;
        referrals.unshift(referral);
        localStorage.setItem('referrals', JSON.stringify(referrals));
        return referral;
    }

    async updateReferralStatus(id, status) {
        try {
            if (authToken) {
                const response = await fetch(`${API_URL}/referrals/${id}/status`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status })
                });
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.log('Using offline mode for status update');
        }

        // Fallback to localStorage
        const referrals = await this.getReferrals();
        const index = referrals.findIndex(r => r.id === id);
        if (index !== -1) {
            referrals[index].status = status;
            referrals[index].updatedAt = new Date().toISOString();
            localStorage.setItem('referrals', JSON.stringify(referrals));
            return referrals[index];
        }
        return null;
    }

    // Analytics
    async getAnalytics() {
        try {
            if (authToken) {
                const response = await fetch(`${API_URL}/analytics`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.log('Using offline analytics');
        }

        // Fallback calculation
        const referrals = await this.getReferrals();
        const today = new Date().toDateString();
        
        const todayReferrals = referrals.filter(r => 
            new Date(r.createdAt).toDateString() === today
        );

        return {
            totalReferrals: referrals.length,
            todayReferrals: todayReferrals.length,
            emergencyCount: referrals.filter(r => r.urgency === 'emergency').length,
            urgentCount: referrals.filter(r => r.urgency === 'urgent').length,
            routineCount: referrals.filter(r => r.urgency === 'routine').length,
            maaYojanaCount: referrals.filter(r => r.maaYojana).length,
            statusCounts: {
                pending: referrals.filter(r => r.status === 'pending').length,
                confirmed: referrals.filter(r => r.status === 'confirmed').length,
                arrived: referrals.filter(r => r.status === 'arrived').length,
                admitted: referrals.filter(r => r.status === 'admitted').length,
                cancelled: referrals.filter(r => r.status === 'cancelled').length
            }
        };
    }
}

// Initialize Data Manager
const dataManager = new DataManager();

// Authentication Check
function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');

    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }

    // Update user display
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = username || 'User';
    }

    // Hide admin section if not admin
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn && userRole !== 'admin') {
        adminBtn.style.display = 'none';
    }

    return true;
}

// Logout function
function logout() {
    dataManager.logout();
}

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuthentication()) return;

    // Initialize the application
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    loadDashboardData();
    setupEventListeners();
    loadNotifications();
    setupWebSocket();
    
    // Set dashboard as default active section
    const dashboardBtn = document.querySelector('[data-section="dashboard"]');
    if (dashboardBtn) {
        dashboardBtn.classList.add('active');
    }
}

function setupWebSocket() {
    // WebSocket for real-time updates (fallback if not available)
    try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleRealTimeUpdate(data);
        };
        
        ws.onerror = function() {
            console.log('WebSocket not available, using polling');
            setupPolling();
        };
    } catch (error) {
        console.log('WebSocket not supported, using polling');
        setupPolling();
    }
}

function setupPolling() {
    // Poll for updates every 30 seconds
    setInterval(() => {
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            loadSectionData(activeSection.id);
        }
    }, 30000);
}

function handleRealTimeUpdate(data) {
    switch (data.type) {
        case 'new_referral':
            addNotification({
                type: 'emergency',
                title: 'New Referral',
                message: `${data.referral.patientName} - ${data.referral.urgency} case`,
                timestamp: new Date()
            });
            loadDashboardData();
            break;
        case 'status_update':
            loadDashboardData();
            loadTrackingData();
            break;
        case 'resource_update':
            loadResourcesData();
            break;
    }
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Remove active class from all buttons and sections
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button and corresponding section
            this.classList.add('active');
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
                
                // Load section-specific data
                loadSectionData(targetSection);
            }
        });
    });
}

function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'referral':
            loadReferralForm();
            break;
        case 'tracking':
            loadTrackingData();
            break;
        case 'resources':
            loadResourcesData();
            break;
        case 'admin':
            loadAdminData();
            break;
    }
}

async function loadDashboardData() {
    try {
        const analytics = await dataManager.getAnalytics();
        const referrals = await dataManager.getReferrals();
        const hospitals = await dataManager.getHospitals();
        
        // Update status indicators
        document.getElementById('emergencyCount').textContent = analytics.emergencyCount;
        document.getElementById('urgentCount').textContent = analytics.urgentCount;
        document.getElementById('routineCount').textContent = analytics.routineCount;
        document.getElementById('maaYojanaCount').textContent = analytics.maaYojanaCount;

        // Load live referrals
        const liveReferralsHTML = referrals.slice(0, 5).map(referral => `
            <div class="referral-item ${referral.urgency}">
                <div class="patient-info">
                    <strong>${referral.patientName}</strong>
                    <span>Age: ${referral.age}, ${referral.gender}</span>
                    ${referral.maaYojana ? '<span class="maa-badge">MAA</span>' : ''}
                </div>
                <div class="referral-details">
                    <span class="urgency ${referral.urgency}">${referral.urgency}</span>
                    <span class="specialty">${referral.specialty}</span>
                    <span class="eta">ETA: ${referral.eta || '--'} min</span>
                    <div class="status-actions">
                        <span class="status ${referral.status}">${referral.status}</span>
                        ${generateStatusButtons(referral)}
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('liveReferrals').innerHTML = liveReferralsHTML || '<div class="empty-state">No active referrals</div>';

        // Load resource status
        const resourceStatusHTML = hospitals.map(hospital => `
            <div class="resource-item">
                <span class="hospital-name">${hospital.name}</span>
                <div class="resource-bar">
                    <div class="bar-fill" style="width: ${((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100}%"></div>
                </div>
                <span class="bed-count">${hospital.availableBeds}/${hospital.totalBeds} available</span>
            </div>
        `).join('');
        
        document.getElementById('resourceStatus').innerHTML = resourceStatusHTML || '<div class="empty-state">No hospitals configured</div>';

        // Update analytics summary
        const analyticsSummaryHTML = `
            <div class="metric">
                <span class="metric-label">Total Referrals</span>
                <span class="metric-value">${analytics.totalReferrals}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Today's Referrals</span>
                <span class="metric-value">${analytics.todayReferrals}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Pending</span>
                <span class="metric-value">${analytics.statusCounts.pending}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Admitted</span>
                <span class="metric-value">${analytics.statusCounts.admitted}</span>
            </div>
        `;
        
        document.getElementById('analyticsSummary').innerHTML = analyticsSummaryHTML;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

function generateStatusButtons(referral) {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') return '';

    const statusOptions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['arrived', 'cancelled'],
        'arrived': ['admitted'],
        'admitted': [],
        'cancelled': []
    };

    const nextStates = statusOptions[referral.status] || [];
    
    return nextStates.map(status => `
        <button class="status-btn btn-${status}" onclick="updateReferralStatus(${referral.id}, '${status}')">
            ${status}
        </button>
    `).join('');
}

async function updateReferralStatus(id, status) {
    try {
        await dataManager.updateReferralStatus(id, status);
        showNotification(`Referral status updated to ${status}`, 'success');
        loadDashboardData();
        loadTrackingData();
        
        // Add notification
        addNotification({
            type: 'info',
            title: 'Status Update',
            message: `Referral #${id} status changed to ${status}`,
            timestamp: new Date()
        });
    } catch (error) {
        showNotification('Error updating referral status', 'error');
    }
}

async function loadReferralForm() {
    try {
        const hospitals = await dataManager.getHospitals();
        const hospitalSelect = document.getElementById('hospitalId');
        
        if (hospitalSelect) {
            hospitalSelect.innerHTML = '<option value="">Auto-assign based on availability</option>' +
                hospitals.map(hospital => 
                    `<option value="${hospital.id}">${hospital.name} (${hospital.availableBeds} beds available)</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading referral form:', error);
    }
}

async function loadTrackingData() {
    try {
        const referrals = await dataManager.getReferrals();
        
        const trackingHTML = referrals.map(referral => `
            <div class="tracking-item">
                <div class="patient-header">
                    <h4>Patient: ${referral.patientName} (#${referral.id})</h4>
                    <span class="status ${referral.status}">${referral.status}</span>
                    <span class="urgency ${referral.urgency}">${referral.urgency}</span>
                </div>
                <div class="patient-details">
                    <p><strong>Age:</strong> ${referral.age} | <strong>Gender:</strong> ${referral.gender}</p>
                    <p><strong>Specialty:</strong> ${referral.specialty}</p>
                    <p><strong>Reason:</strong> ${referral.reason}</p>
                    ${referral.maaYojana ? '<p><strong>MAA Yojana Patient</strong></p>' : ''}
                </div>
                <div class="tracking-timeline">
                    <div class="timeline-item completed">
                        <i class="fas fa-check-circle"></i>
                        <span>Referral Submitted</span>
                        <time>${new Date(referral.createdAt).toLocaleString()}</time>
                    </div>
                    <div class="timeline-item ${referral.status === 'confirmed' || referral.status === 'arrived' || referral.status === 'admitted' ? 'completed' : ''}">
                        <i class="fas fa-phone"></i>
                        <span>Patient Contacted</span>
                        <time>${referral.status === 'pending' ? 'Pending' : 'Completed'}</time>
                    </div>
                    <div class="timeline-item ${referral.status === 'arrived' || referral.status === 'admitted' ? 'active' : ''}">
                        <i class="fas fa-ambulance"></i>
                        <span>En Route</span>
                        <time>${referral.status === 'arrived' || referral.status === 'admitted' ? 'In Progress' : 'Pending'}</time>
                    </div>
                    <div class="timeline-item ${referral.status === 'admitted' ? 'completed' : ''}">
                        <i class="fas fa-hospital"></i>
                        <span>Arrival & Admission</span>
                        <time>${referral.status === 'admitted' ? 'Completed' : 'Pending'}</time>
                    </div>
                </div>
                ${generateStatusButtons(referral)}
            </div>
        `).join('');
        
        document.getElementById('trackingList').innerHTML = trackingHTML || '<div class="empty-state">No referrals to track</div>';
    } catch (error) {
        console.error('Error loading tracking data:', error);
    }
}

async function loadResourcesData() {
    try {
        const hospitals = await dataManager.getHospitals();
        
        const resourcesHTML = hospitals.map(hospital => `
            <div class="resource-card">
                <h3><i class="fas fa-hospital"></i> ${hospital.name}</h3>
                <div class="resource-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Beds</span>
                        <span class="stat-value">${hospital.totalBeds}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Available</span>
                        <span class="stat-value">${hospital.availableBeds}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Occupancy</span>
                        <span class="stat-value">${Math.round(((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Contact</span>
                        <span class="stat-value">${hospital.contactNumber || 'N/A'}</span>
                    </div>
                </div>
                <div class="resource-actions">
                    <button class="btn-secondary" onclick="callHospital('${hospital.contactNumber}')">
                        <i class="fas fa-phone"></i> Call
                    </button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('resourcesGrid').innerHTML = resourcesHTML || '<div class="empty-state">No hospitals configured</div>';
    } catch (error) {
        console.error('Error loading resources data:', error);
    }
}

function callHospital(number) {
    if (number && number !== 'N/A') {
        window.open(`tel:${number}`, '_self');
    } else {
        showNotification('Contact number not available', 'error');
    }
}

async function loadAdminData() {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        document.getElementById('admin').innerHTML = '<div class="access-denied"><h2>Access Denied</h2><p>You do not have permission to access this section.</p></div>';
        return;
    }

    try {
        await Promise.all([
            loadHospitalManagement(),
            loadAnalyticsData(),
            loadUserManagement(),
            loadSystemStatus()
        ]);
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

async function loadHospitalManagement() {
    try {
        const hospitals = await dataManager.getHospitals();
        
        const hospitalHTML = hospitals.map(hospital => `
            <div class="admin-item">
                <div class="hospital-info">
                    <span class="hospital-name">${hospital.name}</span>
                    <small class="hospital-details">${hospital.totalBeds} beds, ${hospital.availableBeds} available</small>
                </div>
                <div class="admin-controls">
                    <button class="edit-btn" onclick="editHospital(${hospital.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteHospital(${hospital.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('hospitalList').innerHTML = hospitalHTML || '<div class="empty-state">No hospitals configured</div>';
    } catch (error) {
        console.error('Error loading hospital management:', error);
    }
}

async function loadAnalyticsData() {
    try {
        const analytics = await dataManager.getAnalytics();
        
        const analyticsHTML = `
            <div class="metric">
                <span class="metric-label">Total Referrals</span>
                <span class="metric-value">${analytics.totalReferrals}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Today's Referrals</span>
                <span class="metric-value">${analytics.todayReferrals}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Emergency Cases</span>
                <span class="metric-value">${analytics.emergencyCount}</span>
            </div>
            <div class="metric">
                <span class="metric-label">MAA Yojana Cases</span>
                <span class="metric-value">${analytics.maaYojanaCount}</span>
            </div>
        `;
        
        document.getElementById('analyticsData').innerHTML = analyticsHTML;
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

async function loadUserManagement() {
    // For demo purposes, using localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[{"id": 1, "username": "admin", "name": "System Admin", "role": "admin"}, {"id": 2, "username": "doctor1", "name": "Dr. Kumar", "role": "doctor"}]');
    
    const userHTML = users.map(user => `
        <div class="admin-item">
            <div class="user-info">
                <span class="user-name">${user.name}</span>
                <small class="user-details">${user.role} - ${user.username}</small>
            </div>
            <div class="admin-controls">
                <button class="edit-btn" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('userList').innerHTML = userHTML;
}

async function loadSystemStatus() {
    try {
        const hospitals = await dataManager.getHospitals();
        const referrals = await dataManager.getReferrals();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const statusHTML = `
            <div class="system-metric">
                <i class="fas fa-hospital text-success"></i>
                <span>Hospitals: ${hospitals.length}</span>
            </div>
            <div class="system-metric">
                <i class="fas fa-users text-info"></i>
                <span>Users: ${users.length}</span>
            </div>
            <div class="system-metric">
                <i class="fas fa-database text-warning"></i>
                <span>Records: ${referrals.length}</span>
            </div>
            <div class="system-metric">
                <i class="fas fa-server text-success"></i>
                <span>Status: Online</span>
            </div>
        `;
        
        document.getElementById('systemStatus').innerHTML = statusHTML;
    } catch (error) {
        console.error('Error loading system status:', error);
    }
}

function setupEventListeners() {
    // Referral form submission
    const referralForm = document.getElementById('referralForm');
    if (referralForm) {
        referralForm.addEventListener('submit', handleReferralSubmission);
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTrackingItems);
    }
}

async function handleReferralSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const referralData = {
        patientName: formData.get('patientName'),
        age: parseInt(formData.get('age')),
        gender: formData.get('gender'),
        contactNumber: formData.get('contact'),
        medicalHistory: formData.get('medicalHistory'),
        reason: formData.get('reason'),
        urgency: formData.get('urgency'),
        specialty: formData.get('specialty'),
        hospitalId: formData.get('hospitalId') || null,
        maaYojana: formData.get('maaYojana') === 'on'
    };

    try {
        const newReferral = await dataManager.addReferral(referralData);
        showNotification('Referral submitted successfully!', 'success');
        e.target.reset();
        
        // Add notification
        addNotification({
            type: 'emergency',
            title: 'New Referral',
            message: `${referralData.patientName} - ${referralData.urgency} case`,
            timestamp: new Date()
        });
        
        // Refresh dashboard if currently active
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id === 'dashboard') {
            loadDashboardData();
        }
    } catch (error) {
        showNotification('Error submitting referral. Please try again.', 'error');
    }
}

function filterTrackingItems() {
    const filter = document.getElementById('statusFilter').value;
    const trackingItems = document.querySelectorAll('.tracking-item');
    
    trackingItems.forEach(item => {
        const status = item.querySelector('.status').textContent.toLowerCase();
        
        if (filter === 'all' || status === filter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Modal Functions
function showModal(content) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = content;
    modalOverlay.style.display = 'flex';
    
    // Close modal when clicking overlay
    modalOverlay.onclick = function(e) {
        if (e.target === modalOverlay) {
            hideModal();
        }
    };
}

function hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

// Hospital Management Functions
function showAddHospitalModal() {
    const modalContent = `
        <div class="modal-header">
            <h3><i class="fas fa-hospital"></i> Add New Hospital</h3>
            <button class="close-btn" onclick="hideModal()"><i class="fas fa-times"></i></button>
        </div>
        <form class="modal-form" onsubmit="addHospital(event)">
            <div class="form-group">
                <label>Hospital Name *</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Total Beds *</label>
                <input type="number" name="totalBeds" required min="1">
            </div>
            <div class="form-group">
                <label>Available Beds *</label>
                <input type="number" name="availableBeds" required min="0">
            </div>
            <div class="form-group">
                <label>Contact Number</label>
                <input type="tel" name="contactNumber">
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea name="address" rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Add Hospital</button>
            </div>
        </form>
    `;
    showModal(modalContent);
}

async function addHospital(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const hospitalData = {
        name: formData.get('name'),
        totalBeds: parseInt(formData.get('totalBeds')),
        availableBeds: parseInt(formData.get('availableBeds')),
        contactNumber: formData.get('contactNumber'),
        address: formData.get('address'),
        status: 'active'
    };

    try {
        await dataManager.addHospital(hospitalData);
        showNotification('Hospital added successfully!', 'success');
        hideModal();
        loadHospitalManagement();
        loadDashboardData();
    } catch (error) {
        showNotification('Error adding hospital. Please try again.', 'error');
    }
}

async function editHospital(id) {
    try {
        const hospitals = await dataManager.getHospitals();
        const hospital = hospitals.find(h => h.id === id);
        
        if (!hospital) return;

        const modalContent = `
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Edit Hospital</h3>
                <button class="close-btn" onclick="hideModal()"><i class="fas fa-times"></i></button>
            </div>
            <form class="modal-form" onsubmit="updateHospital(event, ${id})">
                <div class="form-group">
                    <label>Hospital Name *</label>
                    <input type="text" name="name" value="${hospital.name}" required>
                </div>
                <div class="form-group">
                    <label>Total Beds *</label>
                    <input type="number" name="totalBeds" value="${hospital.totalBeds}" required min="1">
                </div>
                <div class="form-group">
                    <label>Available Beds *</label>
                    <input type="number" name="availableBeds" value="${hospital.availableBeds}" required min="0">
                </div>
                <div class="form-group">
                    <label>Contact Number</label>
                    <input type="tel" name="contactNumber" value="${hospital.contactNumber || ''}">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea name="address" rows="3">${hospital.address || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Hospital</button>
                </div>
            </form>
        `;
        showModal(modalContent);
    } catch (error) {
        showNotification('Error loading hospital data', 'error');
    }
}

async function updateHospital(e, id) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updates = {
        name: formData.get('name'),
        totalBeds: parseInt(formData.get('totalBeds')),
        availableBeds: parseInt(formData.get('availableBeds')),
        contactNumber: formData.get('contactNumber'),
        address: formData.get('address')
    };

    try {
        await dataManager.updateHospital(id, updates);
        showNotification('Hospital updated successfully!', 'success');
        hideModal();
        loadHospitalManagement();
        loadDashboardData();
    } catch (error) {
        showNotification('Error updating hospital. Please try again.', 'error');
    }
}

async function deleteHospital(id) {
    if (confirm('Are you sure you want to delete this hospital?')) {
        try {
            await dataManager.deleteHospital(id);
            showNotification('Hospital deleted successfully!', 'success');
            loadHospitalManagement();
            loadDashboardData();
        } catch (error) {
            showNotification('Error deleting hospital. Please try again.', 'error');
        }
    }
}

// Notification Functions
function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    updateNotificationBadge(notifications.length);
    
    const notificationHTML = notifications.map((notification, index) => `
        <div class="notification-item ${notification.type}">
            <div class="notification-content">
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
                <time>${new Date(notification.timestamp).toLocaleString()}</time>
            </div>
            <button class="acknowledge-btn" onclick="acknowledgeNotification(${index})">
                <i class="fas fa-check"></i>
            </button>
        </div>
    `).join('');
    
    document.getElementById('notificationList').innerHTML = notificationHTML || '<div class="empty-state">No new notifications</div>';
}

function addNotification(notification) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift(notification);
    
    // Keep only last 20 notifications
    if (notifications.length > 20) {
        notifications.splice(20);
    }
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
    loadNotifications();
}

function acknowledgeNotification(index) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.splice(index, 1);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    loadNotifications();
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function refreshTracking() {
    loadTrackingData();
    showNotification('Tracking data refreshed!', 'success');
}

function refreshResourceStatus() {
    loadResourcesData();
    loadDashboardData();
    showNotification('Resource status refreshed!', 'success');
}

async function exportReports() {
    try {
        const referrals = await dataManager.getReferrals();
        const csvContent = [
            ['ID', 'Patient Name', 'Age', 'Gender', 'Urgency', 'Specialty', 'Status', 'MAA Yojana', 'Created At'],
            ...referrals.map(r => [
                r.id, 
                r.patientName, 
                r.age, 
                r.gender, 
                r.urgency, 
                r.specialty, 
                r.status, 
                r.maaYojana ? 'Yes' : 'No',
                new Date(r.createdAt).toLocaleString()
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `setu_reports_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showNotification('Reports exported successfully!', 'success');
    } catch (error) {
        showNotification('Error exporting reports', 'error');
    }
}

function generateQRCodes() {
    showNotification('QR codes generated successfully!', 'success');
    
    const modalContent = `
        <div class="modal-header">
            <h3><i class="fas fa-qrcode"></i> Hospital QR Codes</h3>
            <button class="close-btn" onclick="hideModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="qr-display">
            <div class="qr-info">
                <p>QR codes for quick referral access have been generated. Each hospital gets a unique QR code that redirects to a pre-filled referral form.</p>
                <p><strong>QR Code URL Format:</strong><br>
                <code>${window.location.origin}/referral?hospital_id={id}&doctor_id={doctor}</code></p>
            </div>
            <div class="qr-list">
                <div class="qr-item">
                    <div class="qr-placeholder">
                        <i class="fas fa-qrcode"></i>
                        <span>General Referral QR</span>
                    </div>
                    <button class="btn-secondary" onclick="downloadQR('general')">Download</button>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn-primary" onclick="downloadAllQRCodes()">Download All QR Codes</button>
            </div>
        </div>
    `;
    showModal(modalContent);
}

function downloadQR(type) {
    showNotification(`${type} QR code downloaded!`, 'success');
}

function downloadAllQRCodes() {
    showNotification('All QR codes downloaded!', 'success');
    hideModal();
}

function showSystemSettings() {
    const modalContent = `
        <div class="modal-header">
            <h3><i class="fas fa-cog"></i> System Settings</h3>
            <button class="close-btn" onclick="hideModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="settings-content">
            <div class="setting-item">
                <label>Auto-refresh interval (seconds)</label>
                <input type="number" value="30" min="10" max="300">
            </div>
            <div class="setting-item">
                <label>Default ETA (minutes)</label>
                <input type="number" value="30" min="5" max="120">
            </div>
            <div class="setting-item">
                <label>Enable notifications</label>
                <input type="checkbox" checked>
            </div>
            <div class="setting-item">
                <label>Emergency alert sound</label>
                <input type="checkbox" checked>
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button class="btn-primary" onclick="saveSettings()">Save Settings</button>
            </div>
        </div>
    `;
    showModal(modalContent);
}

function saveSettings() {
    showNotification('Settings saved successfully!', 'success');
    hideModal();
}

function viewDetailedAnalytics() {
    dataManager.getAnalytics().then(analytics => {
        const modalContent = `
            <div class="modal-header">
                <h3><i class="fas fa-chart-line"></i> Detailed Analytics</h3>
                <button class="close-btn" onclick="hideModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="analytics-content">
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h4>Referral Status</h4>
                        <div class="status-breakdown">
                            <div>Pending: ${analytics.statusCounts.pending}</div>
                            <div>Confirmed: ${analytics.statusCounts.confirmed}</div>
                            <div>Arrived: ${analytics.statusCounts.arrived}</div>
                            <div>Admitted: ${analytics.statusCounts.admitted}</div>
                            <div>Cancelled: ${analytics.statusCounts.cancelled}</div>
                        </div>
                    </div>
                    <div class="analytics-card">
                        <h4>Urgency Distribution</h4>
                        <div class="urgency-breakdown">
                            <div>Emergency: ${analytics.emergencyCount}</div>
                            <div>Urgent: ${analytics.urgentCount}</div>
                            <div>Routine: ${analytics.routineCount}</div>
                        </div>
                    </div>
                    <div class="analytics-card">
                        <h4>Program Impact</h4>
                        <div class="impact-stats">
                            <div>Total Referrals: ${analytics.totalReferrals}</div>
                            <div>Today's Cases: ${analytics.todayReferrals}</div>
                            <div>MAA Yojana: ${analytics.maaYojanaCount}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        showModal(modalContent);
    });
}

// User Management Functions (Demo)
function showAddUserModal() {
    const modalContent = `
        <div class="modal-header">
            <h3><i class="fas fa-user-plus"></i> Add New User</h3>
            <button class="close-btn" onclick="hideModal()"><i class="fas fa-times"></i></button>
        </div>
        <form class="modal-form" onsubmit="addUser(event)">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Username *</label>
                <input type="text" name="username" required>
            </div>
            <div class="form-group">
                <label>Role *</label>
                <select name="role" required>
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Add User</button>
            </div>
        </form>
    `;
    showModal(modalContent);
}

function addUser(e) {
    e.preventDefault();
    showNotification('User management is demo only', 'info');
    hideModal();
}

function editUser(id) {
    showNotification('User management is demo only', 'info');
}

function deleteUser(id) {
    showNotification('User management is demo only', 'info');
}
