import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, FlatList, Modal, Button } from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiUrl = "https://snapchat.epidoc.eu/snap";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFuYXNzLmJvdWFvdWRhdGVAZXBpdGVjaC5ldSIsImlhdCI6MTcxNzc2MjQ5OH0.ZZyWQHQXO0115w1B6mSpLb0bBLRadF9rxjayj1YQAJw";

interface Snap {
  _id: string;
  date: string;
  from: string;
  duration: number;
}

interface User {
  _id: string;
  username: string;
}

export default function ReceiveSnaps() {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSnaps();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (remainingTime !== null) {
      countdownInterval.current = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime === 1) {
            clearInterval(countdownInterval.current!);
            handleSnapExpiration();
            return null;
          }
          return prevTime! - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownInterval.current!);
  }, [remainingTime]);

  const fetchSnaps = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(apiUrl, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-api-key": apiKey
        }
      });

      setSnaps(response.data.data);
    } catch (error) {
      setError('Échec de la récupération des snaps');
      console.error('Échec de la récupération des snaps :', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("https://snapchat.epidoc.eu/user", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "x-api-key": apiKey
        }
      });

      setUsers(response.data.data);
    } catch (error) {
      setError('Échec de la récupération des utilisateurs');
      console.error('Échec de la récupération des utilisateurs :', error);
    }
  };

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found.');
      }
      return token;
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      throw error;
    }
  };

  const getUsername = (userId: string) => {
    const user = users.find(user => user._id === userId);
    return user ? user.username : 'Unknown';
  };

  const openSnap = async (snapId: string) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${apiUrl}/${snapId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-api-key": apiKey
        }
      });

      const base64Image = response.data.data.image.split(',')[1];
      const imageUri = `${FileSystem.documentDirectory}${snapId}.png`;

      await FileSystem.writeAsStringAsync(imageUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64
      });

      setSelectedSnap(imageUri);
      setRemainingTime(response.data.data.duration);
      setModalVisible(true);

      setSnaps(currentSnaps => currentSnaps.filter(snap => snap._id !== snapId));
    } catch (error) {
      setError('Échec de l\'ouverture du snap');
      console.error('Échec de l\'ouverture du snap :', error);
    }
  };

  const handleSnapExpiration = async () => {
    try {
      if (selectedSnap) {
        const snapId = selectedSnap.split('/').pop()!.split('.').shift()!;
        const fileInfo = await FileSystem.getInfoAsync(selectedSnap);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(selectedSnap);
          await notifyApiSnapDeletion(snapId);
        } else {
          console.error('File does not exist:', selectedSnap);
        }
      }
    } catch (error) {
      console.error('Failed to delete snap from storage:', error);
    }
    setSelectedSnap(null);
    setModalVisible(false);
  };

  const notifyApiSnapDeletion = async (snapId: string) => {
    try {
      const token = await getAuthToken();
      await axios.put(`${apiUrl}/seen/${snapId}`, {}, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-api-key": apiKey
        }
      });
    } catch (error) {
      console.error('Failed to notify API about snap deletion:', error);
    }
  };

  const renderSnapItem = ({ item }: { item: Snap }) => (
    <View style={styles.snapItem}>
      <Text>{getUsername(item.from)}</Text>
      <TouchableOpacity onPress={() => openSnap(item._id)}>
        <Text style={styles.openButton}>Ouvrir</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={snaps}
        renderItem={renderSnapItem}
        keyExtractor={(item) => item._id}
      />
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Snap</Text>
          {selectedSnap && <Image source={{ uri: selectedSnap }} style={styles.image} />}
          {remainingTime !== null && <Text style={styles.timer}>Duration: {remainingTime}s</Text>}
          <Button title="Fermer" onPress={() => handleSnapExpiration()} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  snapItem: {
    padding: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  openButton: {
    color: 'blue',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  image: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  timer: {
    fontSize: 18,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
});
