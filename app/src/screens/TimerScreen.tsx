import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TimerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Timer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 24,
  },
});
