import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Symptom } from '../types/symptoms';
import { getSymptoms } from '../services/symptomService';
import { format, parseISO } from 'date-fns';

type HistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);

  useEffect(() => {
    loadSymptoms();
  }, []);

  const loadSymptoms = async () => {
    try {
      const loadedSymptoms = await getSymptoms();
      // Filter for sleep symptoms and sort by date
      const sleepSymptoms = loadedSymptoms
        .filter((s: Symptom) => s.name.toLowerCase().includes('sleep'))
        .sort((a: Symptom, b: Symptom) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSymptoms(sleepSymptoms);
    } catch (error) {
      console.error('Error loading symptoms:', error);
    }
  };

  const chartData = {
    labels: symptoms.map(s => format(parseISO(s.date), 'M/d')),
    datasets: [{
      data: symptoms.map(s => s.severity)
    }]
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sleep Severity Over Time</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#4CAF50'
              }
            }}
            bezier
            style={styles.chart}
            yAxisSuffix=""
            yAxisInterval={1}
            fromZero={false}
            segments={9}
            renderDotContent={({ x, y, index, indexData }) => (
              <View
                style={{
                  position: 'absolute',
                  top: y - 20,
                  left: x - 10,
                  backgroundColor: '#4CAF50',
                  borderRadius: 8,
                  padding: 4,
                }}
              >
                <Text style={{ color: 'white', fontSize: 10 }}>
                  {indexData}
                </Text>
              </View>
            )}
          />
        </View>
      </ScrollView>

      <View style={styles.navButtons}>
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
          style={styles.navButton}
          onPress={() => navigation.navigate('Notes')}
        >
          <Text style={styles.navButtonText}>Notes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chartContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 