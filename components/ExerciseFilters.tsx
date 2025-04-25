import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBodyParts, useEquipment } from '@/hooks/useExercises';

type FilterOption = {
  name: string;
  value: string;
};

type ExerciseFiltersProps = {
  onFilterChange: (filters: { bodyPart?: string; equipment?: string; target?: string; search?: string }) => void;
};

const ExerciseFilters: React.FC<ExerciseFiltersProps> = ({ onFilterChange }) => {
  const [activeTab, setActiveTab] = useState<'bodyPart' | 'equipment'>('bodyPart');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | undefined>();
  const [selectedEquipment, setSelectedEquipment] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { bodyParts, loading: loadingBodyParts } = useBodyParts();
  const { equipment, loading: loadingEquipment } = useEquipment();

  // Format the data for display
  const bodyPartOptions: FilterOption[] = bodyParts.map(part => ({ 
    name: part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' '), 
    value: part 
  }));
  
  const equipmentOptions: FilterOption[] = equipment.map(item => ({ 
    name: item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, ' '), 
    value: item 
  }));

  useEffect(() => {
    onFilterChange({
      bodyPart: selectedBodyPart,
      equipment: selectedEquipment,
      search: searchQuery || undefined
    });
  }, [selectedBodyPart, selectedEquipment, searchQuery]);

  const handleBodyPartSelect = (value: string) => {
    if (selectedBodyPart === value) {
      setSelectedBodyPart(undefined);
    } else {
      setSelectedBodyPart(value);
    }
  };

  const handleEquipmentSelect = (value: string) => {
    if (selectedEquipment === value) {
      setSelectedEquipment(undefined);
    } else {
      setSelectedEquipment(value);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const clearFilters = () => {
    setSelectedBodyPart(undefined);
    setSelectedEquipment(undefined);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bodyPart' && styles.activeTab]}
          onPress={() => setActiveTab('bodyPart')}
        >
          <Text style={[styles.tabText, activeTab === 'bodyPart' && styles.activeTabText]}>
            Body Part
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'equipment' && styles.activeTab]}
          onPress={() => setActiveTab('equipment')}
        >
          <Text style={[styles.tabText, activeTab === 'equipment' && styles.activeTabText]}>
            Equipment
          </Text>
        </TouchableOpacity>
      </View>

      {(selectedBodyPart || selectedEquipment || searchQuery) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>Active filters:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilters}>
            {selectedBodyPart && (
              <TouchableOpacity
                style={styles.activeFilterItem}
                onPress={() => setSelectedBodyPart(undefined)}
              >
                <Text style={styles.activeFilterText}>
                  {bodyPartOptions.find(option => option.value === selectedBodyPart)?.name}
                </Text>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}
            {selectedEquipment && (
              <TouchableOpacity
                style={styles.activeFilterItem}
                onPress={() => setSelectedEquipment(undefined)}
              >
                <Text style={styles.activeFilterText}>
                  {equipmentOptions.find(option => option.value === selectedEquipment)?.name}
                </Text>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}
            {searchQuery && (
              <TouchableOpacity
                style={styles.activeFilterItem}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.activeFilterText}>"{searchQuery}"</Text>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.clearAllButton} onPress={clearFilters}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {activeTab === 'bodyPart' ? (
          loadingBodyParts ? (
            <Text style={styles.loadingText}>Loading body parts...</Text>
          ) : (
            bodyPartOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  selectedBodyPart === option.value && styles.selectedOption
                ]}
                onPress={() => handleBodyPartSelect(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedBodyPart === option.value && styles.selectedOptionText
                  ]}
                >
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))
          )
        ) : (
          loadingEquipment ? (
            <Text style={styles.loadingText}>Loading equipment...</Text>
          ) : (
            equipmentOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  selectedEquipment === option.value && styles.selectedOption
                ]}
                onPress={() => handleEquipmentSelect(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedEquipment === option.value && styles.selectedOptionText
                  ]}
                >
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1f2937',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4f46e5',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#4f46e5',
  },
  optionsContainer: {
    paddingHorizontal: 12,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
  },
  selectedOption: {
    backgroundColor: '#4f46e5',
  },
  optionText: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedOptionText: {
    color: '#fff',
  },
  loadingText: {
    padding: 16,
    color: '#6b7280',
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  activeFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  activeFilters: {
    flexDirection: 'row',
  },
  activeFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    color: '#fff',
    marginRight: 8,
    fontSize: 14,
  },
  clearAllButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearAllText: {
    color: '#4b5563',
    fontSize: 14,
  },
});

export default ExerciseFilters; 