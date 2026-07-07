export const canModify = (resourceOwnerId, currentUserId, currentUserRole) => {
    if (!resourceOwnerId || !currentUserId) return false;
    return resourceOwnerId.toString() === currentUserId.toString() || currentUserRole === 'admin';
};
