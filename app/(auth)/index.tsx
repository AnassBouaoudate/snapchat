import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import { Image } from 'react-native';

const url = "https://snapchat.epidoc.eu/user";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFuYXNzLmJvdWFvdWRhdGVAZXBpdGVjaC5ldSIsImlhdCI6MTcxNzc2MjQ5OH0.ZZyWQHQXO0115w1B6mSpLb0bBLRadF9rxjayj1YQAJw";  // Ceci est votre clé API

const Register = () => {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSignup = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const response = await axios.post(url, {
        email: email,
        username: username,
        password: password,
      }, {
        headers: {
          'x-api-key': apiKey
        }
      });

      console.log(response.data);
      router.replace("/login");
    } catch (error) {
      console.error(error);
      setError('An error occurred during registration.');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('./img/snap.webp')} style={styles.image} />

      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Register" onPress={handleSignup} />
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
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    color:'#000',
  },
  input: {
    height: 40,
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export default Register;