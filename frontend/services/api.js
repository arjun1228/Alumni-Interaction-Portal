const API_URL = 'http://127.0.0.1:5000/api';
import { INITIAL_POSTS, INITIAL_JOBS, INITIAL_EVENTS } from '../data/mockData';

// Helper to retrieve JWT from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper to simulate delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchPosts = async () => {
    try {
        const res = await fetch(`${API_URL}/posts`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch posts');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Falling back to mock data for Posts', error);
        return INITIAL_POSTS;
    }
};

export const createPost = async (postData) => {
    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(postData),
        });
        if (!res.ok) throw new Error('Failed to create post');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Creating post locally only', error);
        return { ...postData, id: `local_${Date.now()}` };
    }
};

export const fetchJobs = async () => {
    try {
        const res = await fetch(`${API_URL}/jobs`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Falling back to mock data for Jobs', error);
        return INITIAL_JOBS;
    }
};

export const createJob = async (jobData) => {
    try {
        const payload = {
            title: jobData.title,
            company: jobData.company,
            location: jobData.location,
            type: jobData.type,
            description: jobData.description,
            skillsRequired: jobData.skills || [],
            link: jobData.link
        };

        const res = await fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.message || 'Failed to create job');
        }
        const json = await res.json();
        const data = json.data || json;
        return {
            ...data,
            id: data.id || data._id,
            skills: data.skillsRequired || data.skills || []
        };
    } catch (error) {
        console.warn('Network error: Creating job locally only', error);
        return { ...jobData, id: `local_${Date.now()}` };
    }
};

export const fetchEvents = async () => {
    try {
        const res = await fetch(`${API_URL}/events`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch events');
        const json = await res.json();
        const data = json.data || json;
        // Map backend enums to EventListing properties
        return data.map((e) => ({
            ...e,
            id: e.id || e._id,
            image: e.coverImage || e.image,
            attendees: e.attendeeCount || e.attendees || 0,
            date: e.date || new Date(e.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
            time: e.time || new Date(e.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
    } catch (error) {
        console.warn('Network error: Falling back to mock data for Events', error);
        return INITIAL_EVENTS;
    }
};

export const createEvent = async (eventData) => {
    try {
        // Adapt fields from React Events form to backend Event model expected schema
        const payload = {
            title: eventData.title,
            type: eventData.type,
            description: eventData.description,
            dateTime: new Date(`${eventData.date} ${eventData.time}`).toISOString(),
            coverImage: eventData.image
        };

        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create event');
        const json = await res.json();
        const e = json.data || json;
        return {
            ...e,
            id: e.id || e._id,
            image: e.coverImage || e.image,
            attendees: e.attendeeCount || e.attendees || 0,
            date: eventData.date,
            time: eventData.time
        };
    } catch (error) {
        console.warn('Network error: Creating event locally only', error);
        return { ...eventData, id: `local_${Date.now()}` };
    }
};

export const rsvpEvent = async (eventId, userId) => {
    try {
        const res = await fetch(`${API_URL}/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error('Failed to RSVP to event');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: RSVPing to event locally only', error);
        return { success: true };
    }
};

export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { ...getAuthHeaders() },
            body: formData
        });
        if (!res.ok) throw new Error('Image upload failed');
        const json = await res.json();
        return json.url || json.data?.url;
    } catch (error) {
        console.error('Failed to upload image:', error);
        throw error;
    }
};

export const likePost = async (postId, userId) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error('Failed to like post');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Liking post locally only', error);
        const mockPost = INITIAL_POSTS.find(p => p.id === postId);
        if (mockPost) {
            const hasLiked = mockPost.likedBy.includes(userId);
            const newLikes = hasLiked ? mockPost.likes - 1 : mockPost.likes + 1;
            return { ...mockPost, likes: newLikes, likedBy: hasLiked ? [] : [userId] };
        }
        return { id: postId, likes: 0, likedBy: [userId] };
    }
};

export const registerStudent = async (userData) => {
    try {
        const res = await fetch(`${API_URL}/auth/signup/student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.message || 'Failed to register student');
        }
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Registering student offline', error);
        throw error;
    }
};

export const registerAlumni = async (userData) => {
    try {
        const res = await fetch(`${API_URL}/auth/signup/alumni`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.message || 'Failed to register alumni');
        }
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Registering alumni offline', error);
        throw error;
    }
};

export const loginUser = async (userData) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const { email, password } = userData;

        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            const errMsg = errJson.message || 'Failed to login/register';
            const authError = new Error(errMsg);
            authError.status = res.status;
            throw authError;
        }
        const json = await res.json();
        const data = json.data || json;

        // Save authentication token
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        return {
            ...data.user,
            id: data.user.id || data.user._id,
            avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name || 'User')}&background=random`
        };
    } catch (error) {
        if (error.status === 400 || error.status === 401 || error.status === 403) {
            throw error;
        }
        console.warn('Network error or timeout: Falling back to offline login', error);
        await delay(500);

        const stableId = `offline_${btoa(userData.email || 'user').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

        return {
            ...userData,
            id: stableId,
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`
        };
    }
};

export const updateUser = async (userId, userData) => {
    try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(userData),
        });
        if (!res.ok) throw new Error('Failed to update user');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Updating user locally only', error);
        return { ...userData, id: userId };
    }
};

export const fetchAllUsers = async () => {
    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const json = await res.json();
        const data = json.data || json;
        return data.map((u) => ({
            ...u,
            id: u.id || u._id
        }));
    } catch (error) {
        console.warn('Network error: Falling back to empty directory', error);
        return [];
    }
};

export const fetchMessages = async (userId, otherUserId) => {
    try {
        const res = await fetch(`${API_URL}/messages/${userId}/${otherUserId}`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        return res.json();
    } catch (error) {
        console.warn('Network error: Failed to fetch messages', error);
        throw error;
    }
};

export const sendMessage = async (messageData) => {
    try {
        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                text: messageData.text
            }),
        });
        if (!res.ok) throw new Error('Failed to send message');
        return res.json();
    } catch (error) {
        console.warn('Network error: Sending message locally only', error);
        return { ...messageData, id: `local_${Date.now()}` };
    }
};

export const fetchAdminStudents = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/students/activity-summary`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch students');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Falling back to empty list', error);
        return [];
    }
};

export const fetchAdminAlumni = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/alumni/activity-summary`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch alumni');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Falling back to empty list', error);
        return [];
    }
};

export const applyToJob = async (jobId) => {
    try {
        const res = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        if (!res.ok) throw new Error('Failed to record job application');
        return await res.json();
    } catch (error) {
        console.warn('Network error: Recording application locally', error);
        return { success: true };
    }
};

export const fetchAdminActivities = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/activities`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch activities');
        const json = await res.json();
        return json.data || json;
    } catch (error) {
        console.warn('Network error: Falling back to empty list', error);
        return [];
    }
};

export const deleteJob = async (jobId) => {
    const res = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to delete job');
    }
    return await res.json();
};

export const deleteEvent = async (eventId) => {
    const res = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to delete event');
    }
    return await res.json();
};

export const askMentorResume = async (payload) => {
    const res = await fetch(`${API_URL}/mentor/resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to analyze resume');
    }
    const json = await res.json();
    return json.data?.reply || json.data || json;
};

export const askMentorInterview = async (payload) => {
    const res = await fetch(`${API_URL}/mentor/interview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to get interview feedback');
    }
    const json = await res.json();
    return json.data?.reply || json.data || json;
};

export const askMentorGap = async (payload) => {
    const res = await fetch(`${API_URL}/mentor/gap`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to analyze skill gaps');
    }
    const json = await res.json();
    return json.data?.reply || json.data || json;
};
