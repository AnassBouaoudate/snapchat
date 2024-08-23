import React from "react";
import { Button, StyleSheet, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export const UserLogout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      
      router.replace("/login");
    } catch (error) {
      console.error("Error clearing token: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Log Out" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFF00',
  },
});

export default UserLogout;
