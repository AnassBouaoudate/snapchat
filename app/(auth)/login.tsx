import React, { useState } from "react";
import { Button, StyleSheet, TextInput, View, Text, Image } from "react-native";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const url = "https://snapchat.epidoc.eu/user";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFuYXNzLmJvdWFvdWRhdGVAZXBpdGVjaC5ldSIsImlhdCI6MTcxNzc2MjQ5OH0.ZZyWQHQXO0115w1B6mSpLb0bBLRadF9rxjayj1YQAJw";  // Votre clé API

export const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await axios.put(url, {
        email: email,
        password: password,
      }, {
        headers: {
          'x-api-key': apiKey
        }
      });

      console.log(response.data); 
      
      if (response.data && response.data.data && response.data.data.token) {
        await AsyncStorage.setItem('authToken', response.data.data.token);
        router.replace("/camera");
      } else {
        setError('Token not found in response or response format incorrect');
      }
    } catch (error) {
      console.error(error);
      setError('An error occurred during login.');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('./img/snap.webp')} style={styles.image} />
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        value={email}
        placeholder="Email"
        onChangeText={(text) => setEmail(text)}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Password"
        secureTextEntry
        onChangeText={(text) => setPassword(text)}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Log In" onPress={fetchData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFF00',
  },
  input: {
    height: 40,
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    color:'#000',
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default UserLogin;
