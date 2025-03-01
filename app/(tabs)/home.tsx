import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.statsBox}>
        <Text style={styles.stat}>0 #Treinos</Text>
        <Text style={styles.stat}>0Kgs Volume</Text>
        <Text style={styles.stat}>0m Time</Text>
      </View>
      <Image
        source={require('../../assets/images/muscle-silhouette-front.png')}
        style={styles.silhouette}
      />
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.treinoButton}>
          <Text style={styles.buttonText}>Treino +</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rotateButton}>
          <Ionicons name="refresh-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2c2c3e',
    paddingVertical: 40,
  },
  statsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '95%',
    backgroundColor: '#3e3e50',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  stat: {
    color: '#fff',
    fontSize: 16,
  },
  silhouette: {
    width: 280,
    height: 500,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    justifyContent: 'center',
    position: 'relative',
  },
  treinoButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
  },
  rotateButton: {
    position: 'absolute',
    right: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 