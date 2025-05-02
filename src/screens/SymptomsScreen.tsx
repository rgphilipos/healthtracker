import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { addSymptom, getSymptoms } from '../services/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type SymptomsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Symptoms'>;

interface Symptom {
  id: string;
  name: string;
  severity: number;
  notes: string;
  date: string;
  createdAt: string;
}

export default function SymptomsScreen() {
  const navigation = useNavigation<SymptomsScreenNavigationProp>();

  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [newSymptom, setNewSymptom] = useState({
    name: '',
    severity: 1,
    notes: '',
    date: getLocalDate(),
  });
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadSymptoms();
  }, []);

  const loadSymptoms = async () => {
    try {
      setLoading(true);
      const loadedSymptoms = await getSymptoms();
      setSymptoms(loadedSymptoms);
    } catch (error) {
      console.error('Error loading symptoms:', error);
      Alert.alert('Error', 'Failed to load symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh symptoms when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSymptoms();
    }, [])
  );

  const addSymptomHandler = async () => {
    console.log('Add symptom button clicked');
    if (!newSymptom.name) {
      Alert.alert('Error', 'Please enter a symptom name');
      return;
    }

    try {
      console.log('Attempting to add symptom:', newSymptom);
      await addSymptom(newSymptom);
      console.log('Symptom added successfully');
      setNewSymptom({
        name: '',
        severity: 1,
        notes: '',
        date: getLocalDate(),
      });
      loadSymptoms();
      Alert.alert('Success', 'Symptom added successfully');
    } catch (error) {
      console.error('Error adding symptom:', error);
      Alert.alert('Error', 'Failed to add symptom. Please try again.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'web') {
      setNewSymptom(prev => ({ ...prev, date: event.target.value }));
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setNewSymptom(prev => ({ ...prev, date: formattedDate }));
      }
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={newSymptom.date}
          onChange={onDateChange}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            border: '1px solid #ddd',
            backgroundColor: '#fff',
          }}
        />
      );
    }

    return (
      <>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.dateButtonContent}>
            <MaterialIcons name="calendar-today" size={20} color="#333" />
            <Text style={styles.dateButtonText}>Date: {newSymptom.date}</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(newSymptom.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
      </>
    );
  };

  const getUniqueLatestSymptoms = (symptoms: Symptom[]) => {
    // Create a map to store the latest symptom for each name
    const latestSymptoms = new Map<string, Symptom>();
    
    // Sort symptoms by date (newest first) and then by createdAt (for same date)
    const sortedSymptoms = [...symptoms].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare === 0) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return dateCompare;
    });

    // Keep only the latest symptom for each name
    sortedSymptoms.forEach(symptom => {
      if (!latestSymptoms.has(symptom.name)) {
        latestSymptoms.set(symptom.name, symptom);
      }
    });

    // Convert map values back to array
    return Array.from(latestSymptoms.values());
  };

  const uniqueLatestSymptoms = getUniqueLatestSymptoms(symptoms);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() => navigation.navigate('Symptoms')}
        >
          <Text style={styles.activeNavButtonText}>Symptoms</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Medications')}
        >
          <Text style={styles.navButtonText}>Medications</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Notes')}
        >
          <Text style={styles.navButtonText}>Notes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Symptoms List Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Symptoms</Text>
          {uniqueLatestSymptoms.length === 0 ? (
            <Text style={styles.emptyText}>No symptoms recorded yet</Text>
          ) : (
            uniqueLatestSymptoms.map((symptom) => (
              <TouchableOpacity 
                key={symptom.id} 
                style={styles.symptomItem}
                onPress={() => navigation.navigate('UpdateSymptom', { symptomId: symptom.id })}
              >
                <View style={styles.symptomHeader}>
                  <Text style={styles.symptomName}>{symptom.name}</Text>
                  <Text style={styles.symptomSeverity}>Severity: {symptom.severity}</Text>
                </View>
                <Text style={styles.symptomDate}>Date: {symptom.date}</Text>
                {symptom.notes && (
                  <Text style={styles.symptomNotes}>Notes: {symptom.notes}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Add New Symptom Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Symptom</Text>
          <TextInput
            style={styles.input}
            placeholder="Symptom name"
            value={newSymptom.name}
            onChangeText={(text) => setNewSymptom(prev => ({ ...prev, name: text }))}
          />
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Severity: {newSymptom.severity}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={newSymptom.severity}
              onValueChange={(value: number) => setNewSymptom(prev => ({ ...prev, severity: value }))}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#4CAF50"
            />
          </View>
          {renderDatePicker()}
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes"
            multiline
            value={newSymptom.notes}
            onChangeText={(text) => setNewSymptom(prev => ({ ...prev, notes: text }))}
          />
          <TouchableOpacity style={styles.addButton} onPress={addSymptomHandler}>
            <Text style={styles.addButtonText}>Add Symptom</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#4CAF50',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  navButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeNavButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  activeNavButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  symptomItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  symptomName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  symptomSeverity: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  symptomDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  symptomNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sliderContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 