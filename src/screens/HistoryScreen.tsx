import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Symptom } from '../types/symptoms';
import { getSymptoms } from '../services/symptomService';
import { getMedications } from '../services/firestore';
import { format, parseISO } from 'date-fns';

type HistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

interface Medication {
  id: string;
  name: string;
  dosage: string;
  date: string;
}

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [maxDosage, setMaxDosage] = useState(0);
  const [maxLyricaDosage, setMaxLyricaDosage] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedSymptoms, loadedMedications] = await Promise.all([
        getSymptoms(),
        getMedications()
      ]);

      // Filter for all symptoms and sort by date
      const sleepSymptoms = loadedSymptoms
        .filter((s: Symptom) => s.name.toLowerCase().includes('sleep'))
        .sort((a: Symptom, b: Symptom) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const fatigueSymptoms = loadedSymptoms
        .filter((s: Symptom) => s.name.toLowerCase().includes('fatigue'))
        .sort((a: Symptom, b: Symptom) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const executiveSymptoms = loadedSymptoms
        .filter((s: Symptom) => s.name.toLowerCase().includes('executive'))
        .sort((a: Symptom, b: Symptom) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const depressionSymptoms = loadedSymptoms
        .filter((s: Symptom) => s.name.toLowerCase().includes('depression'))
        .sort((a: Symptom, b: Symptom) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filter for Seroquel and Lyrica, and sort by date
      const seroquelMedications = loadedMedications
        .filter((m: Medication) => m.name.toLowerCase().includes('seroquel'))
        .sort((a: Medication, b: Medication) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const lyricaMedications = loadedMedications
        .filter((m: Medication) => m.name.toLowerCase().includes('lyrica'))
        .sort((a: Medication, b: Medication) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Find the maximum dosages for scaling
      const maxDosage = Math.max(
        ...seroquelMedications.map(m => {
          const dosage = parseInt(m.dosage);
          return isNaN(dosage) ? 0 : dosage;
        })
      );

      const maxLyricaDosage = Math.max(
        ...lyricaMedications.map(m => {
          const dosage = parseInt(m.dosage);
          return isNaN(dosage) ? 0 : dosage;
        })
      );

      setSymptoms([...sleepSymptoms, ...fatigueSymptoms, ...executiveSymptoms, ...depressionSymptoms]);
      setMedications(loadedMedications);
      setMaxDosage(maxDosage);
      setMaxLyricaDosage(maxLyricaDosage);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Get all unique dates from all symptoms and medications
  const getAllDates = () => {
    const dates = new Set<string>();
    // Add all symptom dates
    symptoms
      .filter(s => 
        s.name.toLowerCase().includes('sleep') || 
        s.name.toLowerCase().includes('fatigue') ||
        s.name.toLowerCase().includes('executive') ||
        s.name.toLowerCase().includes('depression')
      )
      .forEach(s => dates.add(s.date));
    
    // Add medication dates
    medications
      .filter(m => m.name.toLowerCase().includes('seroquel') || m.name.toLowerCase().includes('lyrica'))
      .forEach(m => dates.add(m.date));
    
    return Array.from(dates).sort();
  };

  // Get Seroquel dosage for a specific date, maintaining the last known dosage
  const getSeroquelDosage = (date: string): number => {
    // Find the most recent medication record before or on the given date
    const relevantMedications = medications
      .filter(m => m.name.toLowerCase().includes('seroquel') && new Date(m.date) <= new Date(date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (relevantMedications.length > 0) {
      // Get the most recent dosage
      const dosage = parseInt(relevantMedications[0].dosage);
      return isNaN(dosage) ? 0 : dosage;
    }
    return 0; // Return 0 if no medication records found before this date
  };

  // Get Lyrica dosage for a specific date, maintaining the last known dosage
  const getLyricaDosage = (date: string): number => {
    // Find the most recent medication record before or on the given date
    const relevantMedications = medications
      .filter(m => m.name.toLowerCase().includes('lyrica') && new Date(m.date) <= new Date(date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (relevantMedications.length > 0) {
      // Get the most recent dosage
      const dosage = parseInt(relevantMedications[0].dosage);
      return isNaN(dosage) ? 0 : dosage;
    }
    return 0; // Return 0 if no medication records found before this date
  };

  // Get sleep severity for a specific date
  const getSleepSeverity = (date: string): number => {
    const symptom = symptoms.find(s => s.date === date && s.name.toLowerCase().includes('sleep'));
    return symptom ? symptom.severity : 0;
  };

  // Get fatigue severity for a specific date
  const getFatigueSeverity = (date: string): number => {
    const symptom = symptoms.find(s => s.date === date && s.name.toLowerCase().includes('fatigue'));
    return symptom ? symptom.severity : 0;
  };

  // Get executive functioning severity for a specific date
  const getExecutiveSeverity = (date: string): number => {
    const symptom = symptoms.find(s => s.date === date && s.name.toLowerCase().includes('executive'));
    return symptom ? symptom.severity : 0;
  };

  // Get depression severity for a specific date
  const getDepressionSeverity = (date: string): number => {
    const symptom = symptoms.find(s => s.date === date && s.name.toLowerCase().includes('depression'));
    return symptom ? symptom.severity : 0;
  };

  const dates = getAllDates();
  const chartWidth = Dimensions.get('window').width - 40;

  // Generate Y-axis scale markers
  const generateScaleMarkers = () => {
    const markers = [];
    for (let i = 10; i >= 0; i--) {
      markers.push(
        <View key={`marker-${i}`} style={styles.scaleMarker}>
          <Text style={[styles.scaleText, { color: '#4CAF50' }]}>{i}</Text>
          <Text style={[styles.scaleText, { color: '#2196F3' }]}>
            {Math.round((i / 10) * maxDosage)}
          </Text>
          <Text style={[styles.scaleText, { color: '#FF9800' }]}>
            {Math.round((i / 10) * maxLyricaDosage)}
          </Text>
        </View>
      );
    }
    return markers;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sleep and Medication History</Text>
          <View style={styles.chartWrapper}>
            <View style={styles.scaleContainer}>
              {generateScaleMarkers()}
            </View>
            <View style={styles.chartContent}>
              <LineChart
                data={{
                  labels: dates.map(d => format(parseISO(d), 'M/d')),
                  datasets: [
                    {
                      data: dates.map(d => getSleepSeverity(d)),
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for sleep severity
                      strokeWidth: 2
                    },
                    {
                      data: dates.map(d => (getSeroquelDosage(d) / maxDosage) * 10),
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for Seroquel dosage
                      strokeWidth: 2
                    },
                    {
                      data: dates.map(d => (getLyricaDosage(d) / maxLyricaDosage) * 10),
                      color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // Orange for Lyrica dosage
                      strokeWidth: 2
                    }
                  ]
                }}
                width={chartWidth}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '0',
                  }
                }}
                bezier
                style={styles.chart}
                yAxisSuffix=""
                yAxisInterval={1}
                fromZero={false}
                segments={9}
                renderDotContent={({ x, y, index, indexData }) => {
                  const date = dates[index];
                  const actualDosage = getSeroquelDosage(date);
                  const actualLyricaDosage = getLyricaDosage(date);
                  const severity = getSleepSeverity(date);
                  const isSeverity = indexData === severity;
                  const isLyrica = indexData === (actualLyricaDosage / maxLyricaDosage) * 10;
                  
                  if (severity === 0 && actualDosage === 0 && actualLyricaDosage === 0) return null;
                  
                  const dotColor = isSeverity ? '#4CAF50' : (isLyrica ? '#FF9800' : '#2196F3');
                  
                  return (
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: y - 25,
                        left: x - 25,
                        backgroundColor: dotColor,
                        borderRadius: 4,
                        padding: 4,
                        minWidth: 50,
                        alignItems: 'center',
                        opacity: 0.9,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 9 }}>
                        {isSeverity ? severity : (isLyrica ? `${actualLyricaDosage}mg` : `${actualDosage}mg`)}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                getDotColor={(dataPoint, dataPointIndex) => {
                  const date = dates[dataPointIndex];
                  const actualDosage = getSeroquelDosage(date);
                  const actualLyricaDosage = getLyricaDosage(date);
                  const severity = getSleepSeverity(date);
                  
                  if (dataPoint === severity) return '#4CAF50';
                  if (dataPoint === (actualLyricaDosage / maxLyricaDosage) * 10) return '#FF9800';
                  return '#2196F3';
                }}
              />
            </View>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Sleep Severity (0-10)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Seroquel Dosage (mg)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Lyrica Dosage (mg)</Text>
            </View>
          </View>
        </View>

        {/* Fatigue Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Fatigue and Medication History</Text>
          <View style={styles.chartWrapper}>
            <View style={styles.scaleContainer}>
              {generateScaleMarkers()}
            </View>
            <View style={styles.chartContent}>
              <LineChart
                data={{
                  labels: dates.map(d => format(parseISO(d), 'M/d')),
                  datasets: [
                    {
                      data: dates.map(d => getFatigueSeverity(d)),
                      color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`, // Purple for fatigue
                      strokeWidth: 2
                    },
                    {
                      data: dates.map(d => (getSeroquelDosage(d) / maxDosage) * 10),
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      strokeWidth: 2
                    },
                    {
                      data: dates.map(d => (getLyricaDosage(d) / maxLyricaDosage) * 10),
                      color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                      strokeWidth: 2
                    }
                  ]
                }}
                width={chartWidth}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '0',
                  }
                }}
                bezier
                style={styles.chart}
                yAxisSuffix=""
                yAxisInterval={1}
                fromZero={false}
                segments={9}
                renderDotContent={({ x, y, index, indexData }) => {
                  const date = dates[index];
                  const actualDosage = getSeroquelDosage(date);
                  const actualLyricaDosage = getLyricaDosage(date);
                  const severity = getFatigueSeverity(date);
                  const isSeverity = indexData === severity;
                  const isLyrica = indexData === (actualLyricaDosage / maxLyricaDosage) * 10;
                  
                  if (severity === 0 && actualDosage === 0 && actualLyricaDosage === 0) return null;
                  
                  const dotColor = isSeverity ? '#9C27B0' : (isLyrica ? '#FF9800' : '#2196F3');
                  
                  return (
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: y - 25,
                        left: x - 25,
                        backgroundColor: dotColor,
                        borderRadius: 4,
                        padding: 4,
                        minWidth: 50,
                        alignItems: 'center',
                        opacity: 0.9,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 9 }}>
                        {isSeverity ? severity : (isLyrica ? `${actualLyricaDosage}mg` : `${actualDosage}mg`)}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                getDotColor={(dataPoint, dataPointIndex) => {
                  const date = dates[dataPointIndex];
                  const actualDosage = getSeroquelDosage(date);
                  const actualLyricaDosage = getLyricaDosage(date);
                  const severity = getFatigueSeverity(date);
                  
                  if (dataPoint === severity) return '#9C27B0';
                  if (dataPoint === (actualLyricaDosage / maxLyricaDosage) * 10) return '#FF9800';
                  return '#2196F3';
                }}
              />
            </View>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#9C27B0' }]} />
              <Text style={styles.legendText}>Fatigue Severity (0-10)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Seroquel Dosage (mg)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Lyrica Dosage (mg)</Text>
            </View>
          </View>
        </View>

        {/* Executive Functioning Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Executive Functioning and Medication History</Text>
          <View style={styles.chartWrapper}>
            <View style={styles.scaleContainer}>
              {generateScaleMarkers()}
            </View>
            <View style={styles.chartContent}>
              <LineChart
                data={{
                  labels: dates.map(d => format(parseISO(d), 'M/d')),
                  datasets: [
                    {
                      data: dates.map(d => getExecutiveSeverity(d)),
                      color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`, // Pink for executive functioning
                      strokeWidth: 2
                    },
                    {
                      data: dates.map(d => (getSeroquelDosage(d) / maxDosage) * 10),
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      strokeWidth: 2
                    },
                    {
                      data: dates.map(d => (getLyricaDosage(d) / maxLyricaDosage) * 10),
                      color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                      strokeWidth: 2
                    }
                  ]
                }}
                width={chartWidth}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '0',
                  }
                }}
                bezier
                style={styles.chart}
                yAxisSuffix=""
                yAxisInterval={1}
                fromZero={false}
                segments={9}
                renderDotContent={({ x, y, index, indexData }) => {
                  const date = dates[index];
                  const actualDosage = getSeroquelDosage(date);
                  const actualLyricaDosage = getLyricaDosage(date);
                  const severity = getExecutiveSeverity(date);
                  const isSeverity = indexData === severity;
                  const isLyrica = indexData === (actualLyricaDosage / maxLyricaDosage) * 10;
                  
                  if (severity === 0 && actualDosage === 0 && actualLyricaDosage === 0) return null;
                  
                  const dotColor = isSeverity ? '#E91E63' : (isLyrica ? '#FF9800' : '#2196F3');
                  
                  return (
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: y - 25,
                        left: x - 25,
                        backgroundColor: dotColor,
                        borderRadius: 4,
                        padding: 4,
                        minWidth: 50,
                        alignItems: 'center',
                        opacity: 0.9,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 9 }}>
                        {isSeverity ? severity : (isLyrica ? `${actualLyricaDosage}mg` : `${actualDosage}mg`)}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                getDotColor={(dataPoint, dataPointIndex) => {
                  const date = dates[dataPointIndex];
                  const actualDosage = getSeroquelDosage(date);
                  const actualLyricaDosage = getLyricaDosage(date);
                  const severity = getExecutiveSeverity(date);
                  
                  if (dataPoint === severity) return '#E91E63';
                  if (dataPoint === (actualLyricaDosage / maxLyricaDosage) * 10) return '#FF9800';
                  return '#2196F3';
                }}
              />
            </View>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#E91E63' }]} />
              <Text style={styles.legendText}>Executive Functioning Severity (0-10)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Seroquel Dosage (mg)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Lyrica Dosage (mg)</Text>
            </View>
          </View>
        </View>

        {/* Depression Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Depression and Medication History</Text>
          <View style={styles.chartWrapper}>
            <View style={styles.scaleContainer}>
              {generateScaleMarkers()}
            </View>
            <View style={styles.chartContent}>
              <LineChart
                data={{
                  labels: dates.map(d => format(parseISO(d), 'M/d')),
                  datasets: [
                    {
                      data: dates.map(d => getDepressionSeverity(d)),
                      color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red for depression
                      strokeWidth: 2
                    },
                    {
                      data: dates.map(d => (getSeroquelDosage(d) / maxDosage) * 10),
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      strokeWidth: 2
                    },
                    {
                      data: dates.map(d => (getLyricaDosage(d) / maxLyricaDosage) * 10),
                      color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                      strokeWidth: 2
                    }
                  ]
                }}
                width={chartWidth}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '0',
                  }
                }}
                bezier
                style={styles.chart}
                yAxisSuffix=""
                yAxisInterval={1}
                fromZero={false}
                segments={9}
                renderDotContent={({ x, y, index, indexData }) => {
                  const date = dates[index];
                  const actualDosage = getSeroquelDosage(date);
                  const actualLyricaDosage = getLyricaDosage(date);
                  const severity = getDepressionSeverity(date);
                  const isSeverity = indexData === severity;
                  const isLyrica = indexData === (actualLyricaDosage / maxLyricaDosage) * 10;
                  
                  if (severity === 0 && actualDosage === 0 && actualLyricaDosage === 0) return null;
                  
                  const dotColor = isSeverity ? '#F44336' : (isLyrica ? '#FF9800' : '#2196F3');
                  
                  return (
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: y - 25,
                        left: x - 25,
                        backgroundColor: dotColor,
                        borderRadius: 4,
                        padding: 4,
                        minWidth: 50,
                        alignItems: 'center',
                        opacity: 0.9,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 9 }}>
                        {isSeverity ? severity : (isLyrica ? `${actualLyricaDosage}mg` : `${actualDosage}mg`)}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                getDotColor={(dataPoint, dataPointIndex) => {
                  const date = dates[dataPointIndex];
                  const actualDosage = getSeroquelDosage(date);
                  const actualLyricaDosage = getLyricaDosage(date);
                  const severity = getDepressionSeverity(date);
                  
                  if (dataPoint === severity) return '#F44336';
                  if (dataPoint === (actualLyricaDosage / maxLyricaDosage) * 10) return '#FF9800';
                  return '#2196F3';
                }}
              />
            </View>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Depression Severity (0-10)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Seroquel Dosage (mg)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Lyrica Dosage (mg)</Text>
            </View>
          </View>
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
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scaleContainer: {
    width: 40,
    height: 220,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  chartContent: {
    flex: 1,
  },
  scaleMarker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
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