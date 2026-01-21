const prisma = require('../config/prisma');
const { sendEmail } = require('../utils/sendEmail'); // Assuming this utility exists

// Get the IO instance from app
let io;

// Function to set the io instance
function setIO(ioInstance) {
    io = ioInstance;
}

// setIO will be exported with other functions at the end

// Send fee reminder to a specific student's parent
const sendFeeReminder = async (req, res) => {
    try {
        const { studentId, amount, dueDate } = req.body;
        const userId = req.user.id;

        // Get student and parent details
        const student = await prisma.student.findUnique({
            where: { id: parseInt(studentId) },
            include: {
                parent: true,
                class: true
            }
        });

        if (!student || !student.parent) {
            return res.status(404).json({ error: 'Student or parent not found' });
        }

        // Prepare email content
        const subject = `Fee Reminder for ${student.name}`;
        const html = `
            <h2>Fee Payment Reminder</h2>
            <p>Dear Parent,</p>
            <p>We hope this message finds you well. This is a friendly reminder that the fee payment for your child <strong>${student.name}</strong> is pending.</p>
            <p><strong>Amount Due:</strong> $${amount}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p>Class: ${student.class?.name || 'N/A'}</p>
            <p>Please make the payment at your earliest convenience to avoid any late fees.</p>
            <p>Thank you for your cooperation.</p>
        `;

        // Send email
        await sendEmail(student.parent.email, subject, html);

        // Log the notification
        const notification = await prisma.notification.create({
            data: {
                type: 'FEE_REMINDER',
                title: 'Fee Reminder Sent',
                message: `Fee reminder sent to parent of ${student.name}`,
                userId: userId,
                metadata: {
                    studentId: student.id,
                    amount: parseFloat(amount),
                    dueDate: new Date(dueDate)
                }
            }
        });

        // Emit real-time notification event if io is available
        if (io) {
            io.emit('new_notification', notification);
        }

        res.status(200).json({ message: 'Fee reminder sent successfully' });
    } catch (error) {
        console.error('Error sending fee reminder:', error);
        res.status(500).json({ error: 'Failed to send fee reminder' });
    }
};

// Send bulk fee reminders to multiple students
const sendBulkFeeReminders = async (req, res) => {
    try {
        const { studentIds, amount, dueDate } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'Invalid student IDs provided' });
        }

        let successCount = 0;
        let errorCount = 0;

        for (const studentId of studentIds) {
            try {
                const student = await prisma.student.findUnique({
                    where: { id: parseInt(studentId) },
                    include: {
                        parent: true,
                        class: true
                    }
                });

                if (student && student.parent) {
                    const subject = `Fee Reminder for ${student.name}`;
                    const html = `
                        <h2>Fee Payment Reminder</h2>
                        <p>Dear Parent,</p>
                        <p>This is a reminder that the fee payment for your child <strong>${student.name}</strong> is pending.</p>
                        <p><strong>Amount Due:</strong> $${amount}</p>
                        <p><strong>Due Date:</strong> ${dueDate}</p>
                        <p>Class: ${student.class?.name || 'N/A'}</p>
                        <p>Please make the payment at your earliest convenience.</p>
                        <p>Thank you for your cooperation.</p>
                    `;

                    await sendEmail(student.parent.email, subject, html);

                    const notification = await prisma.notification.create({
                        data: {
                            type: 'FEE_REMINDER',
                            title: 'Fee Reminder Sent',
                            message: `Fee reminder sent to parent of ${student.name}`,
                            userId: userId,
                            metadata: {
                                studentId: student.id,
                                amount: parseFloat(amount),
                                dueDate: new Date(dueDate)
                            }
                        }
                    });

                    // Emit real-time notification event if io is available
                    if (io) {
                        io.emit('new_notification', notification);
                    }

                    successCount++;
                }
            } catch (error) {
                console.error(`Error sending fee reminder to student ${studentId}:`, error);
                errorCount++;
            }
        }

        res.status(200).json({ 
            message: `Bulk fee reminders processed`,
            successCount,
            errorCount
        });
    } catch (error) {
        console.error('Error sending bulk fee reminders:', error);
        res.status(500).json({ error: 'Failed to send bulk fee reminders' });
    }
};

// Configure attendance alert settings
const configureAttendanceAlerts = async (req, res) => {
    try {
        const { absentNotification, lateNotification, dailySummary } = req.body;
        const userId = req.user.id;

        // Update user's attendance alert preferences
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                attendanceAlertPreferences: {
                    absentNotification: absentNotification ?? true,
                    lateNotification: lateNotification ?? true,
                    dailySummary: dailySummary ?? false
                }
            }
        });

        // Emit real-time update event if io is available
        if (io) {
            io.emit('updateCommunication', {
                type: 'ATTENDANCE_ALERTS_UPDATE',
                userId: userId,
                preferences: updatedUser.attendanceAlertPreferences
            });
        }

        res.status(200).json({ 
            message: 'Attendance alert preferences updated successfully',
            preferences: updatedUser.attendanceAlertPreferences
        });
    } catch (error) {
        console.error('Error configuring attendance alerts:', error);
        res.status(500).json({ error: 'Failed to configure attendance alerts' });
    }
};

// Get recent notifications
const getRecentNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error getting recent notifications:', error);
        res.status(500).json({ error: 'Failed to get recent notifications' });
    }
};

// Send a message in teacher-parent chat
const sendMessage = async (req, res) => {
    try {
        const { recipientId, content, conversationId } = req.body;
        const senderId = req.user.id;

        // Validate input
        if (!recipientId || !content) {
            return res.status(400).json({ error: 'Recipient ID and content are required' });
        }

        // Create or get conversation
        let conv;
        if (conversationId) {
            // Use existing conversation
            conv = await prisma.conversation.findUnique({
                where: { id: parseInt(conversationId) }
            });
        } else {
            // Create new conversation if it doesn't exist
            conv = await prisma.conversation.create({
                data: {
                    participants: {
                        connect: [
                            { id: senderId },
                            { id: parseInt(recipientId) }
                        ]
                    }
                }
            });
        }

        if (!conv) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                content,
                senderId,
                conversationId: conv.id,
                read: false
            }
        });

        // Emit real-time message event if io is available
        if (io) {
            io.emit('new_message', {
                ...message,
                senderName: req.user.name || req.user.email
            });
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Get conversations for a user
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all conversations where the user is a participant
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        id: userId
                    }
                }
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Format the response to include only the other participant and last message
        const formattedConversations = conversations.map(conv => {
            const otherParticipant = conv.participants.find(p => p.id !== userId);
            const lastMessage = conv.messages[0] || null;
            
            return {
                id: conv.id,
                participant: otherParticipant,
                lastMessage: lastMessage?.content || '',
                lastMessageTime: lastMessage?.createdAt || null,
                unreadCount: 0 // In a real app, this would calculate actual unread messages
            };
        });

        res.status(200).json(formattedConversations);
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
};

// Get messages for a specific conversation
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify user is part of the conversation
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: parseInt(conversationId),
                participants: {
                    some: {
                        id: userId
                    }
                }
            }
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found or access denied' });
        }

        // Get messages in the conversation
        const messages = await prisma.message.findMany({
            where: { conversationId: parseInt(conversationId) },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
};

module.exports = {
    setIO,
    sendFeeReminder,
    sendBulkFeeReminders,
    configureAttendanceAlerts,
    getRecentNotifications,
    sendMessage,
    getConversations,
    getMessages
};