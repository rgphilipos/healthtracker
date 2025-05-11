import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { addMedication, getMedications } from '../services/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type MedicationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Medications'>;

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  taken: boolean;
  date: string;
  createdAt: string;
  purpose: string;
}

export default function MedicationsScreen() {
  const navigation = useNavigation<MedicationsScreenNavigationProp>();

  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    taken: false,
    date: getLocalDate(),
    purpose: '',
  });
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const loadedMedications = await getMedications();
      setMedications(loadedMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'Failed to load medications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [])
  );

  const addMedicationHandler = async () => {
    if (!newMedication.name) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    try {
      await addMedication(newMedication);
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        taken: false,
        date: getLocalDate(),
        purpose: '',
      });
      loadMedications();
      Alert.alert('Success', 'Medication added successfully');
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert('Error', 'Failed to add medication. Please try again.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'web') {
      setNewMedication(prev => ({ ...prev, date: event.target.value }));
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setNewMedication(prev => ({ ...prev, date: formattedDate }));
      }
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={newMedication.date}
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
            <Text style={styles.dateButtonText}>Date: {newMedication.date}</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(newMedication.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
      </>
    );
  };

  const getUniqueLatestMedications = (medications: Medication[]) => {
    const latestMedications = new Map<string, Medication>();
    
    const sortedMedications = [...medications].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare === 0) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return dateCompare;
    });

    sortedMedications.forEach(medication => {
      if (!latestMedications.has(medication.name)) {
        latestMedications.set(medication.name, medication);
      }
    });

    return Array.from(latestMedications.values());
  };

  const uniqueLatestMedications = getUniqueLatestMedications(medications);

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
          style={styles.navButton}
          onPress={() => navigation.navigate('Symptoms')}
        >
          <Text style={styles.navButtonText}>Symptoms</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() => navigation.navigate('Medications')}
        >
          <Text style={styles.activeNavButtonText}>Medications</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Notes')}
        >
          <Text style={styles.navButtonText}>Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.navButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Medications List Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Medications</Text>
          {uniqueLatestMedications.length === 0 ? (
            <Text style={styles.emptyText}>No medications recorded yet</Text>
          ) : (
            uniqueLatestMedications.map((medication) => (
              <TouchableOpacity 
                key={medication.id} 
                style={styles.medicationItem}
                onPress={() => navigation.navigate('UpdateMedication', { medicationId: medication.id })}
              >
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                </View>
                <Text style={styles.medicationDetails}>
                  Dosage: {medication.dosage} | Frequency: {medication.frequency}
                </Text>
                <Text style={styles.medicationDetails}>
                  Purpose: {medication.purpose}
                </Text>
                <Text style={styles.medicationDate}>Date: {medication.date}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Add New Medication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Medication</Text>
          <TextInput
            style={styles.input}
            placeholder="Medication name"
            value={newMedication.name}
            onChangeText={(text) => setNewMedication(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Dosage (e.g., 500mg)"
            value={newMedication.dosage}
            onChangeText={(text) => setNewMedication(prev => ({ ...prev, dosage: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Frequency (e.g., Twice daily)"
            value={newMedication.frequency}
            onChangeText={(text) => setNewMedication(prev => ({ ...prev, frequency: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Purpose (e.g., Pain relief, Blood pressure)"
            value={newMedication.purpose}
            onChangeText={(text) => setNewMedication(prev => ({ ...prev, purpose: text }))}
          />
          {renderDatePicker()}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addMedicationHandler}
          >
            <Text style={styles.addButtonText}>Add Medication</Text>
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
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  navButton: {
    padding: 10,
    borderRadius: 5,
  },
  activeNavButton: {
    backgroundColor: '#4CAF50',
  },
  navButtonText: {
    color: '#333',
    fontSize: 16,
  },
  activeNavButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  medicationItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  medicationDate: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
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
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 