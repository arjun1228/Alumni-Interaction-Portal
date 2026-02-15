const API_URL = 'http://127.0.0.1:5000/api';
import { INITIAL_POSTS, INITIAL_JOBS, INITIAL_EVENTS } from '../data/mockData';

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchPosts = async () => {
    try {
        const res = await fetch(`${API_URL}/posts`);
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
    } catch (error) {
        console.warn('Network error: Falling back to mock data for Posts', error);
        return INITIAL_POSTS;
    }
};

export const createPost = async (postData: any) => {
    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
        });
        if (!res.ok) throw new Error('Failed to create post');
        return res.json();
    } catch (error) {
        console.warn('Network error: Creating post locally only', error);
        return { ...postData, id: `local_${Date.now()}` };
    }
};

export const fetchJobs = async () => {
    try {
        const res = await fetch(`${API_URL}/jobs`);
        if (!res.ok) throw new Error('Failed to fetch jobs');
        return res.json();
    } catch (error) {
        console.warn('Network error: Falling back to mock data for Jobs', error);
        return INITIAL_JOBS;
    }
};

export const createJob = async (jobData: any) => {
    try {
        const res = await fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData),
        });
        if (!res.ok) throw new Error('Failed to create job');
        return res.json();
    } catch (error) {
        console.warn('Network error: Creating job locally only', error);
        return { ...jobData, id: `local_${Date.now()}` };
    }
};

export const fetchEvents = async () => {
    try {
        const res = await fetch(`${API_URL}/events`);
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
    } catch (error) {
        console.warn('Network error: Falling back to mock data for Events', error);
        return INITIAL_EVENTS;
    }
};

export const createEvent = async (eventData: any) => {
    try {
        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        });
        if (!res.ok) throw new Error('Failed to create event');
        return res.json();
    } catch (error) {
        console.warn('Network error: Creating event locally only', error);
        return { ...eventData, id: `local_${Date.now()}` };
    }
};

// Returns updated post object
export const likePost = async (postId: string, userId: string) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error('Failed to like post');
        return res.json();
    } catch (error) {
        // Find post in initial posts for fallback, or better yet, we can't really "return" the updated post
        // without keeping state here. For now, just return a dummy successful toggle.
        console.warn('Network error: Liking post locally only', error);
        // Find the post from mock data if it exists there
        const mockPost = INITIAL_POSTS.find(p => p.id === postId);
        if (mockPost) {
            const hasLiked = mockPost.likedBy.includes(userId);
            const newLikes = hasLiked ? mockPost.likes - 1 : mockPost.likes + 1;
            // Note: This obviously won't persist across refreshing in offline mode, but improves UX
            return { ...mockPost, likes: newLikes, likedBy: hasLiked ? [] : [userId] };
        }
        return { id: postId, likes: 0, likedBy: [userId] }; // Fallback
    }
}

export const loginUser = async (userData: any) => {
    try {
        // Add timeout to fetch to fail fast
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for cold starts

        const res = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Failed to login/register');
        return res.json();
    } catch (error) {
        console.warn('Network error or timeout: Falling back to offline login', error);
        await delay(500); // Simulate network delay

        // Generate stable mock ID based on email to persist identity across refreshes (in offline mode)
        const stableId = `offline_${btoa(userData.email || 'user').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

        return {
            ...userData,
            id: stableId,
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`
        };
    }
}

export const updateUser = async (userId: string, userData: any) => {
    try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
    } catch (error) {
        console.warn('Network error: Updating user locally only', error);
        return { ...userData, id: userId };
    }
}

export const fetchAllUsers = async () => {
    try {
        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    } catch (error) {
        console.warn('Network error: Falling back to empty directory', error);
        return [];
    }
};

export const fetchMessages = async (userId: string, otherUserId: string) => {
    try {
        const res = await fetch(`${API_URL}/messages/${userId}/${otherUserId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        return res.json();
    } catch (error) {
        console.warn('Network error: Failed to fetch messages', error);
        throw error; // Re-throw to prevent overwriting state with empty array
    }
};

export const sendMessage = async (messageData: any) => {
    try {
        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData),
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
        const res = await fetch(`${API_URL}/admin/students`);
        if (!res.ok) throw new Error('Failed to fetch students');
        return res.json();
    } catch (error) {
        console.warn('Network error: Falling back to empty list', error);
        return [];
    }
};

export const fetchAdminAlumni = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/alumni`);
        if (!res.ok) throw new Error('Failed to fetch alumni');
        return res.json();
    } catch (error) {
        console.warn('Network error: Falling back to empty list', error);
        return [];
    }
};

export const fetchAdminActivities = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/activities`);
        if (!res.ok) throw new Error('Failed to fetch activities');
        return res.json();
    } catch (error) {
        console.warn('Network error: Falling back to empty list', error);
        return [];
    }
};
