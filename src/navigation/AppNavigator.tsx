import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SymptomsScreen from '../screens/SymptomsScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import NotesScreen from '../screens/NotesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import UpdateSymptomScreen from '../screens/UpdateSymptomScreen';
import UpdateMedicationScreen from '../screens/UpdateMedicationScreen';
import UpdateNoteScreen from '../screens/UpdateNoteScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Symptoms"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Symptoms" 
        component={SymptomsScreen}
        options={{ title: 'Symptoms' }}
      />
      <Stack.Screen 
        name="Medications" 
        component={MedicationsScreen}
        options={{ title: 'Medications' }}
      />
      <Stack.Screen 
        name="Notes" 
        component={NotesScreen}
        options={{ title: 'Notes' }}
      />
      <Stack.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Stack.Screen 
        name="UpdateSymptom" 
        component={UpdateSymptomScreen}
        options={{ title: 'Update Symptom' }}
      />
      <Stack.Screen 
        name="UpdateMedication" 
        component={UpdateMedicationScreen}
        options={{ title: 'Update Medication' }}
      />
      <Stack.Screen 
        name="UpdateNote" 
        component={UpdateNoteScreen}
        options={{ title: 'Update Note' }}
      />
    </Stack.Navigator>
  );
} 