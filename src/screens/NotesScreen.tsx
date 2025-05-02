import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { addNote, getNotes } from '../services/firestore';

interface Note {
  id: string;
  title: string;
  content: string;
  category: 'life' | 'treatment';
  date: string;
  createdAt: string;
}

export default function NotesScreen() {
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

  const addNoteHandler = async () => {
    if (!newNote.title || !newNote.content) return;

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
      setNewNote({ ...newNote, date: event.target.value });
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setNewNote({ ...newNote, date: formattedDate });
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
        <Text style={styles.headerText}>Notes & Treatment Plan</Text>
      </View>
      
      <View style={styles.inputContainer}>
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
          <Text style={styles.categoryButtonText}>
            {newNote.category === 'life' ? 'Life Notes' : 'Treatment Plan'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={addNoteHandler}>
          <Text style={styles.addButtonText}>Add Note</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.notesList}>
        {notes.map((note) => (
          <View key={note.id} style={styles.noteItem}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.noteCategory}>
                {note.category === 'life' ? 'Life Notes' : 'Treatment Plan'}
              </Text>
            </View>
            <Text style={styles.noteDate}>Date: {note.date}</Text>
            <Text style={styles.noteContent}>{note.content}</Text>
          </View>
        ))}
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
  inputContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  input: {
    backgroundColor: '#fff',
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
  dateButton: {
    backgroundColor: '#fff',
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
  },
  notesList: {
    flex: 1,
    padding: 15,
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
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteCategory: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  noteDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  noteContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 