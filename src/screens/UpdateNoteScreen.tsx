import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { addNote, getNote, updateNote } from '../services/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type UpdateNoteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpdateNote'>;
type UpdateNoteScreenRouteProp = RouteProp<RootStackParamList, 'UpdateNote'>;

export default function UpdateNoteScreen() {
  const route = useRoute<UpdateNoteScreenRouteProp>();
  const navigation = useNavigation<UpdateNoteScreenNavigationProp>();
  const { noteId } = route.params;

  const [note, setNote] = useState({
    title: '',
    content: '',
    category: 'life' as 'life' | 'treatment',
    date: '',
  });
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    loadNote();
  }, []);

  const loadNote = async () => {
    try {
      setLoading(true);
      const loadedNote = await getNote(noteId);
      if (loadedNote) {
        setNote(loadedNote);
      }
    } catch (error) {
      console.error('Error loading note:', error);
      Alert.alert('Error', 'Failed to load note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'web') {
      const newDate = event.target.value;
      if (newDate !== note.date) {
        setIsNewRecord(true);
      }
      setNote(prev => ({ ...prev, date: newDate }));
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        if (formattedDate !== note.date) {
          setIsNewRecord(true);
        }
        setNote(prev => ({ ...prev, date: formattedDate }));
      }
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={note.date}
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
            <Text style={styles.dateButtonText}>Date: {note.date}</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(note.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
      </>
    );
  };

  const toggleCategory = () => {
    setNote(prev => ({
      ...prev,
      category: prev.category === 'life' ? 'treatment' : 'life',
    }));
  };

  const handleUpdate = async () => {
    try {
      if (isNewRecord) {
        // Add a new record with the updated date
        await addNote({
          title: note.title,
          content: note.content,
          category: note.category,
          date: note.date,
        });
        Alert.alert('Success', 'New note record added successfully');
      } else {
        // Update the existing record
        await updateNote(noteId, {
          content: note.content,
          category: note.category,
        });
        Alert.alert('Success', 'Note updated successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
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
        <Text style={styles.headerText}>Update Note</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note Details</Text>
          <Text style={styles.noteTitle}>{note.title}</Text>
          
          {renderDatePicker()}
          {isNewRecord && (
            <Text style={styles.newRecordText}>
              Note: Changing the date will create a new record
            </Text>
          )}

          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="Content"
            multiline
            value={note.content}
            onChangeText={(text) => setNote(prev => ({ ...prev, content: text }))}
          />

          <TouchableOpacity 
            style={[styles.categoryButton, note.category === 'treatment' && styles.categoryButtonActive]}
            onPress={toggleCategory}
          >
            <Text style={[styles.categoryButtonText, note.category === 'treatment' && styles.categoryButtonTextActive]}>
              {note.category === 'life' ? 'Life Notes' : 'Treatment Plan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>
              {isNewRecord ? 'Add New Record' : 'Update Note'}
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
  noteTitle: {
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
  contentInput: {
    height: 150,
    textAlignVertical: 'top',
  },
  categoryButton: {
    backgroundColor: '#ddd',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  categoryButtonTextActive: {
    color: '#fff',
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