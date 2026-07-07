import { z } from 'zod';
import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';

const messageSchemaVal = z.object({
    text: z.string().min(1, 'Message text cannot be empty')
});

export const getConversations = async (req, res, next) => {
    try {
        const currentUserId = (req.user.id || req.user._id).toString();

        // Fetch all messages involving the current user, newest first
        const messages = await dataStore.find('Message', {
            $or: [
                { sender: currentUserId },
                { recipient: currentUserId },
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ]
        }, { sort: { createdAt: -1 } });

        const uniqueUserIds = new Set();
        const lastMessages = {};

        for (const m of messages) {
            const sId = (m.sender || m.senderId || '').toString();
            const rId = (m.recipient || m.receiverId || '').toString();
            if (!sId || !rId) continue;
            
            const otherUserId = sId === currentUserId ? rId : sId;

            if (!uniqueUserIds.has(otherUserId)) {
                uniqueUserIds.add(otherUserId);
                lastMessages[otherUserId] = {
                    text: m.text,
                    createdAt: m.createdAt || m.timestamp,
                    sender: sId
                };
            }
        }

        const idsArray = Array.from(uniqueUserIds);
        
        // Fetch profiles of participants
        const users = await dataStore.find('User', { _id: { $in: idsArray } });

        const conversations = users.map(u => {
            const { passwordHash, ...cleanUser } = u;
            const otherId = (u.id || u._id).toString();
            return {
                user: cleanUser,
                lastMessage: lastMessages[otherId] || null
            };
        });

        const mappedConversations = serializePayload(conversations);

        res.status(200).json({
            success: true,
            data: mappedConversations
        });
    } catch (err) {
        next(err);
    }
};

export const getChatHistory = async (req, res, next) => {
    try {
        const currentUserId = (req.user.id || req.user._id).toString();
        const otherUserId = req.params.userId;

        // Fetch all messages between current user and target user, oldest first
        const messages = await dataStore.find('Message', {
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { senderId: currentUserId, receiverId: otherUserId },
                { sender: otherUserId, recipient: currentUserId },
                { senderId: otherUserId, receiverId: currentUserId }
            ]
        }, { sort: { createdAt: 1 } });

        const mapped = messages.map(m => ({
            id: m.id || m._id,
            senderId: m.sender || m.senderId,
            receiverId: m.recipient || m.receiverId,
            text: m.text,
            timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
            read: m.readStatus || m.read || false
        }));

        res.status(200).json({
            success: true,
            data: mapped
        });
    } catch (err) {
        next(err);
    }
};

export const sendMessage = async (req, res, next) => {
    try {
        const currentUserId = (req.user.id || req.user._id).toString();
        const otherUserId = req.params.userId;

        const parsed = messageSchemaVal.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { text } = parsed.data;

        // Verify recipient exists
        const recipient = await dataStore.findById('User', otherUserId);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'Recipient user not found.'
            });
        }

        const messageData = {
            sender: currentUserId,
            recipient: otherUserId,
            text,
            readStatus: false
        };

        const newMessage = await dataStore.insert('Message', messageData);

        res.status(201).json({
            success: true,
            data: newMessage
        });
    } catch (err) {
        next(err);
    }
};

export const getMessagesBetweenUsers = async (req, res, next) => {
    try {
        const { senderId, receiverId } = req.params;

        const messages = await dataStore.find('Message', {
            $or: [
                { sender: senderId, recipient: receiverId },
                { senderId: senderId, receiverId: receiverId },
                { sender: receiverId, recipient: senderId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }, { sort: { createdAt: 1 } });

        const mapped = messages.map(m => ({
            id: m.id || m._id,
            senderId: m.sender || m.senderId,
            receiverId: m.recipient || m.receiverId,
            text: m.text,
            timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
            read: m.readStatus || m.read || false
        }));

        res.status(200).json(mapped);
    } catch (err) {
        next(err);
    }
};

export const sendMessageLegacy = async (req, res, next) => {
    try {
        const { senderId, receiverId, text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Message text is required' });
        }

        const messageData = {
            sender: senderId,
            recipient: receiverId,
            text,
            readStatus: false
        };

        const newMessage = await dataStore.insert('Message', messageData);

        const mapped = {
            id: newMessage.id || newMessage._id,
            senderId: newMessage.sender,
            receiverId: newMessage.recipient,
            text: newMessage.text,
            timestamp: newMessage.createdAt,
            read: newMessage.readStatus || false
        };

        res.status(201).json(mapped);
    } catch (err) {
        next(err);
    }
};
