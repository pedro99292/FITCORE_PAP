import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface SimpleDatePickerProps {
  date: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  minimumDate?: Date;
}

const SimpleDatePicker: React.FC<SimpleDatePickerProps> = ({
  date,
  onDateChange,
  placeholder = 'Set date',
  minimumDate = new Date(),
}) => {
  const { colors, isDarkMode } = useTheme();
  const [showManualInput, setShowManualInput] = useState(false);
  const [dateInput, setDateInput] = useState('');

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDatePress = () => {
    if (Platform.OS === 'web') {
      setShowManualInput(true);
    } else {
      // For mobile, show a simple date selection
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      Alert.alert(
        'Select Target Date',
        'Choose when you want to achieve this goal:',
        [
          { text: 'Tomorrow', onPress: () => onDateChange(tomorrow) },
          { text: 'Next Week', onPress: () => onDateChange(nextWeek) },
          { text: 'Next Month', onPress: () => onDateChange(nextMonth) },
          { text: 'Custom Date', onPress: () => setShowManualInput(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleManualDateInput = () => {
    if (!dateInput) {
      setShowManualInput(false);
      return;
    }

    // Try to parse the date input
    const parsedDate = new Date(dateInput);
    
    if (isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid date (e.g., 2024-12-31 or Dec 31, 2024)');
      return;
    }

    if (parsedDate < minimumDate) {
      Alert.alert('Invalid Date', 'Target date cannot be in the past');
      return;
    }

    onDateChange(parsedDate);
    setShowManualInput(false);
    setDateInput('');
  };

  const handleClearDate = () => {
    onDateChange(null);
  };

  if (showManualInput) {
    return (
      <View style={styles.manualInputContainer}>
        <TextInput
          style={[styles.manualInput, { 
            backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
            borderColor: colors.border, 
            color: colors.text 
          }]}
          placeholder="Enter date (e.g., 2024-12-31)"
          placeholderTextColor={colors.text + '60'}
          value={dateInput}
          onChangeText={setDateInput}
          autoFocus
        />
        <View style={styles.manualInputButtons}>
          <TouchableOpacity
            style={[styles.manualInputButton, { 
              backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
              borderColor: colors.border 
            }]}
            onPress={() => {
              setShowManualInput(false);
              setDateInput('');
            }}
          >
            <Text style={[styles.manualInputButtonText, { color: colors.text + '80' }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.manualInputButton, { backgroundColor: '#4a90e2', borderColor: '#4a90e2' }]}
            onPress={handleManualDateInput}
          >
            <Text style={[styles.manualInputButtonText, { color: '#ffffff' }]}>Set Date</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dateSelector, { 
          backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
          borderColor: colors.border 
        }]}
        onPress={handleDatePress}
      >
        <Text style={[styles.dateSelectorText, { color: date ? colors.text : colors.text + '60' }]}>
          {date ? formatDate(date) : placeholder}
        </Text>
        <FontAwesome name="calendar" size={16} color={colors.text + '60'} />
      </TouchableOpacity>
      
      {date && (
        <TouchableOpacity
          style={styles.clearDateButton}
          onPress={handleClearDate}
        >
          <Text style={[styles.clearDateText, { color: '#ff6b6b' }]}>Clear date</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateSelectorText: {
    fontSize: 16,
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  manualInputContainer: {
    width: '100%',
  },
  manualInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  manualInputButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  manualInputButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  manualInputButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SimpleDatePicker; 