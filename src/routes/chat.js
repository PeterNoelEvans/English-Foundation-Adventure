const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================================
// CHAT ROOM MANAGEMENT
// ============================================================================

// Get all chat rooms for the current user
router.get('/rooms', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get chat rooms where the user is a participant
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        isActive: true,
        organizationId: req.user.organizationId,
        participants: {
          some: {
            userId: userId,
            isActive: true
          }
        }
      },
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                profilePicture: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format the response
    const formattedRooms = chatRooms.map(room => {
      const lastMessage = room.messages[0];
      const otherParticipants = room.participants.filter(p => p.userId !== userId);
      
      return {
        id: room.id,
        name: room.name || (room.type === 'direct' && otherParticipants.length === 1 
          ? `${otherParticipants[0].user.firstName} ${otherParticipants[0].user.lastName}`
          : room.name),
        type: room.type,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          sender: lastMessage.sender
        } : null,
        participants: room.participants.map(p => ({
          id: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          email: p.user.email,
          role: p.user.role,
          profilePicture: p.user.profilePicture
        })),
        unreadCount: 0 // Will be calculated separately
      };
    });

    res.json({ chatRooms: formattedRooms });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new chat room
router.post('/rooms', auth, [
  body('type').isIn(['direct', 'group', 'class']).withMessage('Invalid chat type'),
  body('participantIds').isArray().withMessage('Participant IDs must be an array'),
  body('name').optional().isString().withMessage('Name must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, participantIds, name } = req.body;
    const currentUserId = req.user.userId;

    // Add current user to participants if not already included
    const allParticipantIds = [...new Set([currentUserId, ...participantIds])];

    // Verify all participants exist and belong to the same organization
    const participants = await prisma.user.findMany({
      where: {
        id: { in: allParticipantIds },
        organizationId: req.user.organizationId
      }
    });

    if (participants.length !== allParticipantIds.length) {
      return res.status(400).json({ message: 'Some participants not found' });
    }

    // For direct chats, check if a room already exists
    if (type === 'direct' && allParticipantIds.length === 2) {
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          type: 'direct',
          organizationId: req.user.organizationId,
          participants: {
            every: {
              userId: { in: allParticipantIds },
              isActive: true
            }
          }
        }
      });

      if (existingRoom) {
        return res.json({ 
          message: 'Direct chat room already exists',
          chatRoom: existingRoom 
        });
      }
    }

    // Create the chat room
    const chatRoom = await prisma.chatRoom.create({
      data: {
        name: name || null,
        type,
        organizationId: req.user.organizationId,
        participants: {
          create: allParticipantIds.map(userId => ({
            userId,
            role: participants.find(p => p.id === userId)?.role || 'student'
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Chat room created successfully',
      chatRoom 
    });
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// MESSAGE MANAGEMENT
// ============================================================================

// Get messages for a chat room
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is a participant in this room
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId: req.user.userId,
        isActive: true
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: roomId
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: parseInt(limit)
    });

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: { not: req.user.userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ 
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/rooms/:roomId/messages', auth, [
  body('content').notEmpty().withMessage('Message content is required'),
  body('messageType').optional().isIn(['text', 'file', 'image', 'system']).withMessage('Invalid message type'),
  body('replyToId').optional().isUUID().withMessage('Invalid reply message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId } = req.params;
    const { content, messageType = 'text', replyToId } = req.body;

    // Verify user is a participant in this room
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId: req.user.userId,
        isActive: true
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify reply message exists if provided
    if (replyToId) {
      const replyMessage = await prisma.chatMessage.findFirst({
        where: {
          id: replyToId,
          chatRoomId: roomId
        }
      });

      if (!replyMessage) {
        return res.status(400).json({ message: 'Reply message not found' });
      }
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        content,
        messageType,
        senderId: req.user.userId,
        chatRoomId: roomId,
        replyToId: replyToId || null
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Update chat room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ 
      message: 'Message sent successfully',
      chatMessage: message 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit a message
router.patch('/messages/:messageId', auth, [
  body('content').notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    // Get the message and verify ownership
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        senderId: req.user.userId
      },
      include: {
        chatRoom: {
          include: {
            participants: {
              where: { userId: req.user.userId, isActive: true }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or access denied' });
    }

    // Update the message
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true
          }
        }
      }
    });

    res.json({ 
      message: 'Message updated successfully',
      chatMessage: updatedMessage 
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Get the message and verify ownership
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        senderId: req.user.userId
      }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or access denied' });
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// PARTICIPANT MANAGEMENT
// ============================================================================

// Add participant to chat room
router.post('/rooms/:roomId/participants', auth, [
  body('userId').isUUID().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId } = req.params;
    const { userId } = req.body;

    // Verify user is a participant in this room
    const currentParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId: req.user.userId,
        isActive: true
      }
    });

    if (!currentParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify the user to be added exists and belongs to the same organization
    const userToAdd = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: req.user.organizationId
      }
    });

    if (!userToAdd) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId: userId
      }
    });

    if (existingParticipant) {
      if (existingParticipant.isActive) {
        return res.status(400).json({ message: 'User is already a participant' });
      } else {
        // Reactivate the participant
        await prisma.chatParticipant.update({
          where: { id: existingParticipant.id },
          data: { isActive: true, leftAt: null }
        });
      }
    } else {
      // Add new participant
      await prisma.chatParticipant.create({
        data: {
          userId: userId,
          chatRoomId: roomId,
          role: userToAdd.role
        }
      });
    }

    res.json({ message: 'Participant added successfully' });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove participant from chat room
router.delete('/rooms/:roomId/participants/:userId', auth, async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    // Verify user is a participant in this room
    const currentParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId: req.user.userId,
        isActive: true
      }
    });

    if (!currentParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find the participant to remove
    const participantToRemove = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId: userId
      }
    });

    if (!participantToRemove) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Remove the participant (mark as inactive)
    await prisma.chatParticipant.update({
      where: { id: participantToRemove.id },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    });

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

// Get unread message count for a user
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await prisma.chatMessage.count({
      where: {
        senderId: { not: req.user.userId },
        isRead: false,
        chatRoom: {
          participants: {
            some: {
              userId: req.user.userId,
              isActive: true
            }
          }
        }
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available users for creating new chats
router.get('/available-users', auth, async (req, res) => {
  try {
    const { role } = req.query;
    const currentUser = req.user;

    let whereClause = {
      organizationId: currentUser.organizationId,
      id: { not: currentUser.userId },
      active: true
    };

    // Filter by role if specified
    if (role) {
      whereClause.role = role;
    }

    // For students, show only teachers and admins
    if (currentUser.role === 'STUDENT') {
      whereClause.role = { in: ['TEACHER', 'ADMIN'] };
    }

    // For teachers, show students and other teachers/admins
    if (currentUser.role === 'TEACHER') {
      whereClause.role = { in: ['STUDENT', 'TEACHER', 'ADMIN'] };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePicture: true,
        classroom: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    res.json({ users });
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
