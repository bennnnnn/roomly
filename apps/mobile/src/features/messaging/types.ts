export interface ConversationItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingThumbnail: string | null;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  isMine: boolean;
}
