import React, { useState, useEffect, useRef } from 'react';
import axios from '../api';

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
      nickname?: string;
    };
  };
  participants: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
    nickname?: string;
  }>;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  content: string;
  messageType: string;
  isRead: boolean;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    profilePicture?: string;
    nickname?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      nickname?: string;
    };
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
  nickname?: string;
  classroom?: {
    name: string;
  };
}

const ChatInterface: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct');
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Function to get profile picture URL
  const getProfilePictureUrl = (filename?: string) => {
    if (!filename) return '/avatar.png';
    return `https://lms-pne.uk/api/auth/profile-pictures/${filename}`;
  };

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/chat/rooms');
      setChatRooms(response.data.chatRooms);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch chat rooms');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected room
  const fetchMessages = async (roomId: string, page: number = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/chat/rooms/${roomId}/messages?page=${page}&limit=50`);
      if (page === 1) {
        setMessages(response.data.messages);
      } else {
        setMessages(prev => [...response.data.messages, ...prev]);
      }
      setHasMoreMessages(response.data.hasMore);
      setCurrentPage(page);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available users for new chat
  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get('/chat/available-users');
      setAvailableUsers(response.data.users);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch available users');
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const response = await axios.post(`/chat/rooms/${selectedRoom.id}/messages`, {
        content: newMessage.trim(),
        messageType: 'text'
      });

      // Add new message to the list
      setMessages(prev => [...prev, response.data.chatMessage]);
      setNewMessage('');
      
      // Update chat room's last message
      setChatRooms(prev => prev.map(room => 
        room.id === selectedRoom.id 
          ? { ...room, lastMessage: response.data.chatMessage }
          : room
      ));

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send message');
    }
  };

  // Create new chat room
  const createNewChat = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const response = await axios.post('/chat/rooms', {
        type: newChatType,
        participantIds: selectedUsers,
        name: newChatName || undefined
      });

      // Add new room to the list
      if (response.data.chatRoom) {
        setChatRooms(prev => [response.data.chatRoom, ...prev]);
      }

      setShowNewChatModal(false);
      setSelectedUsers([]);
      setNewChatName('');
      setNewChatType('direct');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create chat room');
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Load more messages
  const loadMoreMessages = () => {
    if (selectedRoom && hasMoreMessages && !loading) {
      fetchMessages(selectedRoom.id, currentPage + 1);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch initial data
  useEffect(() => {
    fetchChatRooms();
  }, []);

  // Fetch messages when room is selected
  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  // Fetch available users when modal opens
  useEffect(() => {
    if (showNewChatModal) {
      fetchAvailableUsers();
    }
  }, [showNewChatModal]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Chat Rooms Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && chatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : chatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      <img
                        src={getProfilePictureUrl(room.participants?.[0]?.profilePicture)}
                        alt={room.participants?.[0]?.name || 'Chat'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/avatar.png';
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {room.name || room.participants.map(p => p.name).join(', ')}
                      </p>
                      {room.participants?.[0]?.nickname && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {room.participants[0].nickname}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        <span className="font-medium">
                          {room.lastMessage.sender.firstName} {room.lastMessage.sender.lastName}
                          {room.lastMessage.sender.nickname && (
                            <span className="ml-1 text-xs text-blue-600">
                              ({room.lastMessage.sender.nickname})
                            </span>
                          )}
                          :
                        </span>{' '}
                        {room.lastMessage.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {room.lastMessage ? formatTime(room.lastMessage.createdAt) : 'No messages yet'}
                    </p>
                  </div>
                  {room.unreadCount > 0 && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {room.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img
                    src={getProfilePictureUrl(selectedRoom.participants[0]?.profilePicture)}
                    alt={selectedRoom.participants[0]?.name || 'Chat'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/avatar.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {selectedRoom.name || selectedRoom.participants.map(p => p.name).join(', ')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedRoom.participants.length} participant{selectedRoom.participants.length !== 1 ? 's' : ''}
                    {selectedRoom.participants[0]?.nickname && (
                      <span className="ml-2 text-blue-600">
                        • {selectedRoom.participants[0].nickname}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {hasMoreMessages && (
                <div className="text-center">
                  <button
                    onClick={loadMoreMessages}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load more messages'}
                  </button>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      <img
                        src={getProfilePictureUrl(message.sender.profilePicture)}
                        alt={`${message.sender.firstName} ${message.sender.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/avatar.png';
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {message.sender.firstName} {message.sender.lastName}
                        </span>
                        {message.sender.nickname && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {message.sender.nickname}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      {message.replyTo && (
                        <div className="mb-2 p-2 bg-gray-50 rounded text-sm text-gray-600 border-l-2 border-blue-500">
                          <div className="font-medium">
                            {message.replyTo.sender.firstName} {message.replyTo.sender.lastName}
                            {message.replyTo.sender.nickname && (
                              <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                {message.replyTo.sender.nickname}
                              </span>
                            )}
                          </div>
                          <div className="truncate">{message.replyTo.content}</div>
                        </div>
                      )}
                      <p className="text-sm text-gray-900">{message.content}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {message.isEdited && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Start New Conversation</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chat Type
                  </label>
                  <select
                    value={newChatType}
                    onChange={(e) => setNewChatType(e.target.value as 'direct' | 'group')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="direct">Direct Message</option>
                    <option value="group">Group Chat</option>
                  </select>
                </div>

                {newChatType === 'group' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter group name..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Participants
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                    {availableUsers.map((user) => (
                      <label key={user.id} className="flex items-center p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, user.id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <div>
                          <div className="text-sm font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.role} • {user.email}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewChat}
                  disabled={selectedUsers.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
