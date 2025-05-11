import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Symptom } from '../types/symptoms';

export const getSymptoms = async (): Promise<Symptom[]> => {
  try {
    const symptomsCollection = collection(db, 'symptoms');
    const snapshot = await getDocs(symptomsCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Symptom));
  } catch (error) {
    console.error('Error getting symptoms:', error);
    throw error;
  }
}; 