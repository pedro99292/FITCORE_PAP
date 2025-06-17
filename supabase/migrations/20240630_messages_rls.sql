-- Add RLS policies for the messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to read messages in conversations they're part of
CREATE POLICY "Users can read messages in their conversations" 
ON messages 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT participant_id FROM participants WHERE conversation_id = messages.conversation_id
  )
);

-- Policy for users to insert messages in conversations they're part of
CREATE POLICY "Users can insert messages in their conversations" 
ON messages 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT participant_id FROM participants WHERE conversation_id = messages.conversation_id
  )
);

-- Policy for users to update messages they've sent
CREATE POLICY "Users can update messages they've sent" 
ON messages 
FOR UPDATE 
USING (
  auth.uid() = sender_id
);

-- Policy for users to update read status of messages they've received
CREATE POLICY "Users can mark received messages as read" 
ON messages 
FOR UPDATE 
USING (
  -- User must be a participant in the conversation
  auth.uid() IN (
    SELECT participant1_id FROM conversations WHERE conversation_id = messages.conversation_id
    UNION
    SELECT participant2_id FROM conversations WHERE conversation_id = messages.conversation_id
  )
  -- User is not the sender (can only mark messages received, not sent)
  AND auth.uid() != sender_id
  -- Only allowing updates to the read field
);

-- Policy for users to delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON messages 
FOR DELETE 
USING (
  auth.uid() = sender_id
); 