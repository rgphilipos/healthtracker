export type RootStackParamList = {
  Symptoms: undefined;
  Medications: undefined;
  Notes: undefined;
  History: undefined;
  UpdateSymptom: {
    symptomId: string;
  };
  UpdateMedication: {
    medicationId: string;
  };
  UpdateNote: {
    noteId: string;
  };
}; 