import { dataStore } from '../services/dataStore.js';

export const logAdminAction = async (adminId, action, targetType, targetId) => {
    try {
        const logData = {
            adminId: adminId ? adminId.toString() : 'system',
            action,
            targetType,
            targetId: targetId ? targetId.toString() : 'none'
            // createdAt is set automatically by Mongoose { timestamps: true }
        };
        await dataStore.insert('AdminLog', logData);
        console.log(`[AdminLog] Admin ${adminId} performed ${action} on ${targetType} (${targetId})`);
    } catch (err) {
        console.error('Failed to log admin action:', err);
    }
};
