import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, FlatList, Modal, ListRenderItem } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiUrl = "https://snapchat.epidoc.eu/user";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFuYXNzLmJvdWFvdWRhdGVAZXBpdGVjaC5ldSIsImlhdCI6MTcxNzc2MjQ5OH0.ZZyWQHQXO0115w1B6mSpLb0bBLRadF9rxjayj1YQAJw";

interface User {
  _id: string;
  username: string;
}

export default function App() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(5);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "x-api-key": apiKey
        }
      });

      setUsers(response.data.data);
    } catch (error) {
      setError('Échec récupération des utilisateurs');
      console.error('Échec récupération des utilisateurs :', error);
    }
  };

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('token found.');
      }
      return token;
    } catch (error) {
      console.error('Failed to found token:', error);
      throw error;
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>Nous avons besoin de votre permission pour afficher la caméra</Text>
        <Button onPress={requestPermission} title="Accorder la permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    if (camera) {
      const data = await camera.takePictureAsync(null);
      setImage(data.uri);
    }
  };

  const deleteImage = () => {
    setImage(null);
  };

  const sendImage = async (userId: string) => {
    try {
      if (!image) return;

      console.log("Resizing image...");
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        image,
        [{ resize: { width: 360, height: 640 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      console.log("Resized image:", manipulatedImage.uri);

      console.log("Converting image to base64...");
      const base64Image = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("Base64 image: (truncated)", base64Image.slice(0, 100));

      const payload = {
        to: userId,
        image: `data:image/png;base64,${base64Image}`,
        duration: duration, // Pass the selected duration
      };

      console.log("Retrieving authentication token...");
      const token = await getAuthToken();

      console.log("Sending image...");
      const response = await fetch('https://snapchat.epidoc.eu/snap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-key': apiKey
        },
        body: JSON.stringify(payload),
      });

      console.log(await response.json());
      setModalVisible(false);
      setImage(null);
    } catch (error) {
      console.error('Failed to send image:', error);
      setError('Failed to send image');
    }
  };

  const renderUserItem: ListRenderItem<User> = ({ item }) => (
    <TouchableOpacity onPress={() => sendImage(item._id)}>
      <View style={styles.userItem}>
        <Text>{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={ref => setCamera(ref)}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
          <Button title="Take picture" onPress={takePicture} />
        </View>
      </CameraView>
      {image && (
        <View style={styles.imageContainer}>
          <View style={styles.durationContainer}>
            <TouchableOpacity onPress={() => setDuration(1)} style={styles.durationButton}>
              <Text style={styles.durationText}>1 sec</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDuration(3)} style={styles.durationButton}>
              <Text style={styles.durationText}>3 sec</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDuration(5)} style={styles.durationButton}>
              <Text style={styles.durationText}>5 sec</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDuration(10)} style={styles.durationButton}>
              <Text style={styles.durationText}>10 sec</Text>
            </TouchableOpacity>
          </View>
          <Image source={{ uri: image }} style={styles.image} />
          <Button title="Delete" onPress={deleteImage} />
          <Button title="Send" onPress={() => { setModalVisible(true); fetchUsers(); }} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Gallery" onPress={pickImage} />
      </View>
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select user</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item._id}
          />
          <Button title="Fermer" onPress={() => setModalVisible(false)} />
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
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    paddingTop: 40,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    justifyContent: 'center',
    display: 'flex',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    right: '5%',
    bottom: '10%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  durationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    zIndex: 11,
    justifyContent: 'center',
    width: '100%',
  },
  durationButton: {
    margin: 5,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
  },
  durationText: {
    color: 'black',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  userItem: {
    padding: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
});
