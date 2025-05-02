import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { addMedication, getMedication, updateMedication } from '../services/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import DateTimePicker from '@react-native-community/datetimepicker';

type UpdateMedicationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpdateMedication'>;
type UpdateMedicationScreenRouteProp = RouteProp<RootStackParamList, 'UpdateMedication'>;

export default function UpdateMedicationScreen() {
  const route = useRoute<UpdateMedicationScreenRouteProp>();
  const navigation = useNavigation<UpdateMedicationScreenNavigationProp>();
  const { medicationId } = route.params;

  const [medication, setMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    date: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    loadMedication();
  }, []);

  const loadMedication = async () => {
    try {
      setLoading(true);
      const loadedMedication = await getMedication(medicationId);
      if (loadedMedication) {
        setMedication(loadedMedication);
      }
    } catch (error) {
      console.error('Error loading medication:', error);
      Alert.alert('Error', 'Failed to load medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'web') {
      const newDate = event.target.value;
      if (newDate !== medication.date) {
        setIsNewRecord(true);
      }
      setMedication(prev => ({ ...prev, date: newDate }));
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        if (formattedDate !== medication.date) {
          setIsNewRecord(true);
        }
        setMedication(prev => ({ ...prev, date: formattedDate }));
      }
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={medication.date}
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
            <Text style={styles.dateButtonText}>Date: {medication.date}</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(medication.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
      </>
    );
  };

  const handleUpdate = async () => {
    try {
      if (isNewRecord) {
        // Add a new record with the updated date
        await addMedication({
          name: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          date: medication.date,
          purpose: medication.purpose,
        });
        Alert.alert('Success', 'New medication record added successfully');
      } else {
        // Update the existing record
        await updateMedication(medicationId, {
          dosage: medication.dosage,
          frequency: medication.frequency,
          purpose: medication.purpose,
        });
        Alert.alert('Success', 'Medication updated successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Update Medication</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Details</Text>
          <Text style={styles.medicationName}>{medication.name}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Dosage (e.g., 500mg)"
            value={medication.dosage}
            onChangeText={(text) => setMedication(prev => ({ ...prev, dosage: text }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Frequency (e.g., Twice daily)"
            value={medication.frequency}
            onChangeText={(text) => setMedication(prev => ({ ...prev, frequency: text }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Purpose (e.g., Pain relief, Blood pressure)"
            value={medication.purpose}
            onChangeText={(text) => setMedication(prev => ({ ...prev, purpose: text }))}
          />

          {renderDatePicker()}
          {isNewRecord && (
            <Text style={styles.newRecordText}>
              Note: Changing the date will create a new record
            </Text>
          )}

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>
              {isNewRecord ? 'Add New Record' : 'Update Medication'}
            </Text>
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
  header: {
    padding: 15,
    backgroundColor: '#4CAF50',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  newRecordText: {
    color: '#FF9800',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 