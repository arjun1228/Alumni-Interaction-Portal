export const toDbRole = (frontendRole) => {
    if (!frontendRole) return frontendRole;
    const r = frontendRole.toUpperCase();
    if (r === 'UNDERGRADUATE' || r === 'STUDENT') return 'student';
    if (r === 'GRADUATE' || r === 'ALUMNI') return 'alumni';
    if (r === 'ADMIN') return 'admin';
    return frontendRole.toLowerCase();
};

export const toFrontendRole = (dbRole) => {
    if (!dbRole) return dbRole;
    const r = dbRole.toLowerCase();
    if (r === 'student') return 'UNDERGRADUATE';
    if (r === 'alumni') return 'GRADUATE';
    if (r === 'admin') return 'ADMIN';
    return dbRole.toUpperCase();
};

export const serializeUser = (user) => {
    if (!user) return user;

    const raw = typeof user.toObject === 'function' ? user.toObject() : user;
    const serialized = { ...raw };

    // Standardize IDs
    if (serialized._id && !serialized.id) {
        serialized.id = serialized._id.toString();
    }
    if (serialized.id && !serialized._id) {
        serialized._id = serialized.id;
    }

    // Format Role
    if (serialized.role) {
        serialized.role = toFrontendRole(serialized.role);
    }

    // Secure sensitive data
    delete serialized.password;
    delete serialized.passwordHash;
    delete serialized.verificationToken;
    delete serialized.referenceToken;

    // Standardize avatar and profilePicture
    if (serialized.profilePicture && !serialized.avatar) {
        serialized.avatar = serialized.profilePicture;
    }
    if (serialized.avatar && !serialized.profilePicture) {
        serialized.profilePicture = serialized.avatar;
    }

    return serialized;
};

export const serializePayload = (data) => {
    if (!data) return data;

    if (Array.isArray(data)) {
        return data.map(item => serializePayload(item));
    }

    if (typeof data !== 'object') return data;

    // Check if the current object itself is a user record
    if (data.email && data.role) {
        return serializeUser(data);
    }

    const raw = typeof data.toObject === 'function' ? data.toObject() : data;
    const mapped = { ...raw };

    // Map nested profiles
    if (mapped.author && typeof mapped.author === 'object') {
        mapped.author = serializeUser(mapped.author);
    }
    if (mapped.organizer && typeof mapped.organizer === 'object') {
        mapped.organizer = serializeUser(mapped.organizer);
    }
    if (mapped.postedBy && typeof mapped.postedBy === 'object') {
        mapped.postedBy = serializeUser(mapped.postedBy);
    }
    if (mapped.user && typeof mapped.user === 'object') {
        mapped.user = serializeUser(mapped.user);
    }

    // Standardize Event attendeeCount at serialization time
    if (mapped.attendees && Array.isArray(mapped.attendees)) {
        mapped.attendeeCount = mapped.attendees.length;
    }

    // Standardize top-level IDs
    if (mapped._id && !mapped.id) {
        mapped.id = mapped._id.toString();
    }

    return mapped;
};
