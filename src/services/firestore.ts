import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, getDoc, Firestore } from 'firebase/firestore';
import { db } from '../config/firebase';

interface BaseItem {
  id: string;
  createdAt: string;
}

interface SymptomData {
  name: string;
  severity: number;
  notes: string;
  date: string;
}

interface MedicationData {
  name: string;
  dosage: string;
  frequency: string;
  date: string;
  purpose: string;
}

export interface NoteData {
  title: string;
  content: string;
  category: 'life' | 'treatment';
  date: string;
}

// Symptoms
export const addSymptom = async (symptom: SymptomData) => {
  try {
    console.log('Attempting to add symptom to Firestore:', symptom);
    const docRef = await addDoc(collection(db, 'symptoms'), {
      ...symptom,
      createdAt: new Date().toISOString(),
    });
    console.log('Symptom added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding symptom to Firestore:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    throw error;
  }
};

export const getSymptoms = async (): Promise<(SymptomData & BaseItem)[]> => {
  try {
    const q = query(collection(db, 'symptoms'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (SymptomData & BaseItem)[];
  } catch (error) {
    console.error('Error getting symptoms:', error);
    throw error;
  }
};

export const getSymptom = async (id: string): Promise<SymptomData & BaseItem> => {
  try {
    const docRef = doc(db, 'symptoms', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Symptom not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as SymptomData & BaseItem;
  } catch (error) {
    console.error('Error getting symptom:', error);
    throw error;
  }
};

export const updateSymptom = async (id: string, data: Partial<SymptomData>) => {
  try {
    const docRef = doc(db, 'symptoms', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating symptom:', error);
    throw error;
  }
};

// Medications
export const addMedication = async (medication: MedicationData) => {
  try {
    const docRef = await addDoc(collection(db, 'medications'), {
      ...medication,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

export const getMedications = async (): Promise<(MedicationData & BaseItem)[]> => {
  try {
    const q = query(collection(db, 'medications'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (MedicationData & BaseItem)[];
  } catch (error) {
    console.error('Error getting medications:', error);
    throw error;
  }
};

export const getMedication = async (id: string): Promise<MedicationData & BaseItem> => {
  try {
    const docRef = doc(db, 'medications', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Medication not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as MedicationData & BaseItem;
  } catch (error) {
    console.error('Error getting medication:', error);
    throw error;
  }
};

export const updateMedication = async (id: string, data: Partial<MedicationData>) => {
  try {
    const docRef = doc(db, 'medications', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

export const updateMedicationTaken = async (id: string, taken: boolean) => {
  try {
    const medicationRef = doc(db, 'medications', id);
    await updateDoc(medicationRef, { taken });
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

// Notes
export const addNote = async (note: NoteData) => {
  try {
    const docRef = await addDoc(collection(db, 'notes'), {
      ...note,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

export const getNotes = async (): Promise<(NoteData & BaseItem)[]> => {
  try {
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (NoteData & BaseItem)[];
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
};

export const getNote = async (id: string): Promise<NoteData & BaseItem> => {
  try {
    const docRef = doc(db, 'notes', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Note not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as NoteData & BaseItem;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

export const updateNote = async (id: string, data: Partial<NoteData>) => {
  try {
    const docRef = doc(db, 'notes', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}; 