import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimpleStoryEditor from './SimpleStoryEditor';

interface StoryEditorButtonProps {
  userId: string;
  onStoryCreated?: () => void;
}

const StoryEditorButton: React.FC<StoryEditorButtonProps> = ({ userId, onStoryCreated = () => {} }) => {
  const [showEditor, setShowEditor] = useState(false);

  const handleOpenEditor = () => {
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
  };

  const handleStoryCreated = () => {
    setShowEditor(false);
    onStoryCreated();
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={handleOpenEditor}>
        <Ionicons name="add-circle" size={24} color="#FFFFFF" />
        <Text style={styles.buttonText}>Create Story</Text>
      </TouchableOpacity>

      <SimpleStoryEditor
        visible={showEditor}
        onClose={handleCloseEditor}
        onStoryCreated={handleStoryCreated}
        userId={userId}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default StoryEditorButton; 