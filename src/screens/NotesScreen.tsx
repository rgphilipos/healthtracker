import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { addNote, getNotes } from '../services/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NotesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notes'>;

interface Note {
  id: string;
  title: string;
  content: string;
  category: 'life' | 'treatment';
  date: string;
  createdAt: string;
}

export default function NotesScreen() {
  const navigation = useNavigation<NotesScreenNavigationProp>();
  const [showLifeNotes, setShowLifeNotes] = useState(false);

  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'life' as 'life' | 'treatment',
    date: getLocalDate(),
  });
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const loadedNotes = await getNotes();
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const addNoteHandler = async () => {
    if (!newNote.title || !newNote.content) {
      Alert.alert('Error', 'Please enter both title and content');
      return;
    }

    try {
      await addNote(newNote);
      setNewNote({
        title: '',
        content: '',
        category: 'life',
        date: getLocalDate(),
      });
      loadNotes();
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note. Please try again.');
    }
  };

  const toggleCategory = () => {
    setNewNote(prev => ({
      ...prev,
      category: prev.category === 'life' ? 'treatment' : 'life',
    }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'web') {
      setNewNote(prev => ({ ...prev, date: event.target.value }));
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setNewNote(prev => ({ ...prev, date: formattedDate }));
      }
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={newNote.date}
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
            <Text style={styles.dateButtonText}>Date: {newNote.date}</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(newNote.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
      </>
    );
  };

  const getUniqueLatestNotes = (notes: Note[]) => {
    // Create a map to store the latest note for each title
    const latestNotes = new Map<string, Note>();
    
    // Sort notes by date (newest first) and then by createdAt (for same date)
    const sortedNotes = [...notes].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare === 0) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return dateCompare;
    });

    // Keep only the latest note for each title
    sortedNotes.forEach(note => {
      if (!latestNotes.has(note.title)) {
        latestNotes.set(note.title, note);
      }
    });

    // Convert map values back to array
    return Array.from(latestNotes.values());
  };

  const uniqueLatestNotes = getUniqueLatestNotes(notes);
  const treatmentNotes = uniqueLatestNotes.filter(note => note.category === 'treatment');
  const lifeNotes = uniqueLatestNotes.filter(note => note.category === 'life');

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
          style={styles.navButton}
          onPress={() => navigation.navigate('Medications')}
        >
          <Text style={styles.navButtonText}>Medications</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() => navigation.navigate('Notes')}
        >
          <Text style={styles.activeNavButtonText}>Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.navButtonText}>History</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Treatment Plans Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment Plans</Text>
          {treatmentNotes.length === 0 ? (
            <Text style={styles.emptyText}>No treatment plans recorded yet</Text>
          ) : (
            treatmentNotes.map((note) => (
              <TouchableOpacity 
                key={note.id} 
                style={styles.noteItem}
                onPress={() => navigation.navigate('UpdateNote', { noteId: note.id })}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle}>{note.title}</Text>
                </View>
                <Text style={styles.noteDate}>Date: {note.date}</Text>
                <Text style={styles.noteContent}>{note.content}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Life Notes Toggle */}
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setShowLifeNotes(!showLifeNotes)}
        >
          <Text style={styles.toggleButtonText}>
            {showLifeNotes ? 'Hide Life Notes' : 'See Life Notes'}
          </Text>
        </TouchableOpacity>

        {/* Life Notes Section */}
        {showLifeNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Life Notes</Text>
            {lifeNotes.length === 0 ? (
              <Text style={styles.emptyText}>No life notes recorded yet</Text>
            ) : (
              lifeNotes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                  </View>
                  <Text style={styles.noteDate}>Date: {note.date}</Text>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Add New Note Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={newNote.title}
          onChangeText={(text) => setNewNote(prev => ({ ...prev, title: text }))}
        />
        {renderDatePicker()}
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Content"
          multiline
          value={newNote.content}
          onChangeText={(text) => setNewNote(prev => ({ ...prev, content: text }))}
        />
        <TouchableOpacity 
          style={[styles.categoryButton, newNote.category === 'treatment' && styles.categoryButtonActive]}
          onPress={toggleCategory}
        >
            <Text style={[styles.categoryButtonText, newNote.category === 'treatment' && styles.categoryButtonTextActive]}>
            {newNote.category === 'life' ? 'Life Notes' : 'Treatment Plan'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={addNoteHandler}>
          <Text style={styles.addButtonText}>Add Note</Text>
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
  noteItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  noteContent: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 