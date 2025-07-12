
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'setu_secret_key_2024';

// File paths for data storage
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HOSPITALS_FILE = path.join(DATA_DIR, 'hospitals.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Ensure data directory exists
async function ensureDataDirectory() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Initialize data files
async function initializeDataFiles() {
    await ensureDataDirectory();

    // Initialize users file
    try {
        await fs.access(USERS_FILE);
    } catch {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: await bcrypt.hash('admin123', 10),
                name: 'System Administrator',
                email: 'admin@setu.gov.in',
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                username: 'doctor1',
                password: await bcrypt.hash('doctor123', 10),
                name: 'Dr. Rajesh Kumar',
                email: 'rajesh@setu.gov.in',
                role: 'doctor',
                createdAt: new Date().toISOString()
            }
        ];
        await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    }

    // Initialize hospitals file
    try {
        await fs.access(HOSPITALS_FILE);
    } catch {
        const defaultHospitals = [
            {
                id: 1,
                name: 'Government Medical College Hospital',
                totalBeds: 150,
                availableBeds: 45,
                status: 'active',
                address: 'Medical College Road, District HQ',
                contactNumber: '+91-9876543210',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'District Civil Hospital',
                totalBeds: 100,
                availableBeds: 25,
                status: 'active',
                address: 'Civil Lines, District HQ',
                contactNumber: '+91-9876543211',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Community Health Centre A',
                totalBeds: 50,
                availableBeds: 15,
                status: 'active',
                address: 'Block A, Rural Area',
                contactNumber: '+91-9876543212',
                createdAt: new Date().toISOString()
            }
        ];
        await fs.writeFile(HOSPITALS_FILE, JSON.stringify(defaultHospitals, null, 2));
    }

    // Initialize referrals file
    try {
        await fs.access(REFERRALS_FILE);
    } catch {
        const defaultReferrals = [
            {
                id: 1,
                patientName: 'John Doe',
                age: 45,
                gender: 'male',
                contactNumber: '+91-9876543212',
                medicalHistory: 'Hypertension, Diabetes',
                reason: 'Chest pain, shortness of breath',
                urgency: 'emergency',
                specialty: 'cardiology',
                status: 'confirmed',
                maaYojana: false,
                referredBy: 'Dr. Smith',
                hospitalId: 1,
                eta: 15,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        await fs.writeFile(REFERRALS_FILE, JSON.stringify(defaultReferrals, null, 2));
    }
}

// Helper functions for file operations
async function readJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

async function writeJSONFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Admin middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const users = await readJSONFile(USERS_FILE);
        const user = users.find(u => u.username === username);

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, name, email, role } = req.body;
        
        if (!username || !password || !name || !email || !role) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const users = await readJSONFile(USERS_FILE);
        
        if (users.find(u => u.username === username || u.email === email)) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now(),
            username,
            password: hashedPassword,
            name,
            email,
            role,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeJSONFile(USERS_FILE, users);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Hospital management routes
app.get('/api/hospitals', authenticateToken, async (req, res) => {
    try {
        const hospitals = await readJSONFile(HOSPITALS_FILE);
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hospitals' });
    }
});

app.post('/api/hospitals', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, totalBeds, availableBeds, address, contactNumber } = req.body;
        
        if (!name || !totalBeds || !address) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const hospitals = await readJSONFile(HOSPITALS_FILE);
        const newHospital = {
            id: Date.now(),
            name,
            totalBeds: parseInt(totalBeds),
            availableBeds: parseInt(availableBeds) || 0,
            status: 'active',
            address,
            contactNumber: contactNumber || '',
            createdAt: new Date().toISOString()
        };

        hospitals.push(newHospital);
        await writeJSONFile(HOSPITALS_FILE, hospitals);

        res.status(201).json(newHospital);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create hospital' });
    }
});

app.put('/api/hospitals/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const hospitals = await readJSONFile(HOSPITALS_FILE);
        const hospitalIndex = hospitals.findIndex(h => h.id === parseInt(id));

        if (hospitalIndex === -1) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        hospitals[hospitalIndex] = { ...hospitals[hospitalIndex], ...updateData };
        await writeJSONFile(HOSPITALS_FILE, hospitals);

        res.json(hospitals[hospitalIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update hospital' });
    }
});

// Referral management routes
app.get('/api/referrals', authenticateToken, async (req, res) => {
    try {
        const referrals = await readJSONFile(REFERRALS_FILE);
        const sortedReferrals = referrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(sortedReferrals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch referrals' });
    }
});

app.post('/api/referrals', authenticateToken, async (req, res) => {
    try {
        const {
            patientName,
            age,
            gender,
            contactNumber,
            medicalHistory,
            reason,
            urgency,
            specialty,
            maaYojana,
            hospitalId
        } = req.body;

        if (!patientName || !age || !gender || !reason || !urgency || !specialty) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const referrals = await readJSONFile(REFERRALS_FILE);
        const newReferral = {
            id: Date.now(),
            patientName,
            age: parseInt(age),
            gender,
            contactNumber: contactNumber || '',
            medicalHistory: medicalHistory || '',
            reason,
            urgency,
            specialty,
            maaYojana: Boolean(maaYojana),
            hospitalId: hospitalId ? parseInt(hospitalId) : null,
            status: 'pending',
            referredBy: req.user.username,
            eta: Math.floor(Math.random() * 45) + 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        referrals.unshift(newReferral);
        await writeJSONFile(REFERRALS_FILE, referrals);

        res.status(201).json(newReferral);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create referral' });
    }
});

app.put('/api/referrals/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'arrived', 'admitted', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const referrals = await readJSONFile(REFERRALS_FILE);
        const referralIndex = referrals.findIndex(r => r.id === parseInt(id));

        if (referralIndex === -1) {
            return res.status(404).json({ error: 'Referral not found' });
        }

        referrals[referralIndex].status = status;
        referrals[referralIndex].updatedAt = new Date().toISOString();

        await writeJSONFile(REFERRALS_FILE, referrals);
        res.json(referrals[referralIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update referral status' });
    }
});

// Analytics routes
app.get('/api/analytics', authenticateToken, async (req, res) => {
    try {
        const referrals = await readJSONFile(REFERRALS_FILE);
        const hospitals = await readJSONFile(HOSPITALS_FILE);

        const today = new Date().toDateString();
        const todayReferrals = referrals.filter(r => 
            new Date(r.createdAt).toDateString() === today
        );

        const analytics = {
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
                admitted: referrals.filter(r => r.status === 'admitted').length
            },
            totalHospitals: hospitals.length,
            activeHospitals: hospitals.filter(h => h.status === 'active').length,
            totalBeds: hospitals.reduce((sum, h) => sum + h.totalBeds, 0),
            availableBeds: hospitals.reduce((sum, h) => sum + h.availableBeds, 0)
        };

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
initializeDataFiles().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`SETU Medical Referral Server running on port ${PORT}`);
        console.log(`Access the application at: http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});
