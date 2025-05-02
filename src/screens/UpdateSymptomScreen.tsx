import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { addSymptom, getSymptom, updateSymptom } from '../services/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import DateTimePicker from '@react-native-community/datetimepicker';

type UpdateSymptomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpdateSymptom'>;
type UpdateSymptomScreenRouteProp = RouteProp<RootStackParamList, 'UpdateSymptom'>;

export default function UpdateSymptomScreen() {
  const route = useRoute<UpdateSymptomScreenRouteProp>();
  const navigation = useNavigation<UpdateSymptomScreenNavigationProp>();
  const { symptomId } = route.params;

  const [symptom, setSymptom] = useState({
    name: '',
    severity: 1,
    notes: '',
    date: '',
  });
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    loadSymptom();
  }, []);

  const loadSymptom = async () => {
    try {
      setLoading(true);
      const loadedSymptom = await getSymptom(symptomId);
      if (loadedSymptom) {
        setSymptom(loadedSymptom);
      }
    } catch (error) {
      console.error('Error loading symptom:', error);
      Alert.alert('Error', 'Failed to load symptom. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'web') {
      const newDate = event.target.value;
      if (newDate !== symptom.date) {
        setIsNewRecord(true);
      }
      setSymptom(prev => ({ ...prev, date: newDate }));
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        if (formattedDate !== symptom.date) {
          setIsNewRecord(true);
        }
        setSymptom(prev => ({ ...prev, date: formattedDate }));
      }
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={symptom.date}
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
            <Text style={styles.dateButtonText}>Date: {symptom.date}</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(symptom.date)}
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
        await addSymptom({
          name: symptom.name,
          severity: symptom.severity,
          notes: symptom.notes,
          date: symptom.date,
        });
        Alert.alert('Success', 'New symptom record added successfully');
      } else {
        // Update the existing record
        await updateSymptom(symptomId, {
          severity: symptom.severity,
          notes: symptom.notes,
        });
        Alert.alert('Success', 'Symptom updated successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving symptom:', error);
      Alert.alert('Error', 'Failed to save symptom. Please try again.');
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
        <Text style={styles.headerText}>Update Symptom</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptom Details</Text>
          <Text style={styles.symptomName}>{symptom.name}</Text>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Severity: {symptom.severity}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={symptom.severity}
              onValueChange={(value: number) => setSymptom(prev => ({ ...prev, severity: value }))}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#4CAF50"
            />
          </View>

          {renderDatePicker()}
          {isNewRecord && (
            <Text style={styles.newRecordText}>
              Note: Changing the date will create a new record
            </Text>
          )}

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes"
            multiline
            value={symptom.notes}
            onChangeText={(text) => setSymptom(prev => ({ ...prev, notes: text }))}
          />

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>
              {isNewRecord ? 'Add New Record' : 'Update Symptom'}
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
  symptomName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
  input: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
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